/* Marki · UAP — versión 3 (antes Radar de Marca Digital, Marcómetro, Pulso de Marca y Clicnica)
   Herramienta para diagnosticar la presencia digital de los negocios de Cobija a partir de su información pública.
   Funciona en el navegador; los datos se guardan en esta computadora. */
(function () {
  'use strict';
  var R = window.RUBRICA, DIMS = R.dimensiones, ITEMS = [], ITEM = {};
  DIMS.forEach(function (d) { d.items.forEach(function (it) { it.dim = d.id; ITEMS.push(it); ITEM[it.id] = it; }); });
  /* [valor guardado, texto en pantalla, cómo se busca en ChatGPT, nombre corto]. Los valores de la versión anterior se conservan para no romper las evaluaciones guardadas. */
  var RUBROS_D = [
    ['Restaurante o comida', 'Restaurante, pollería o comida rápida', 'restaurantes y comida', 'Comida'],
    ['Cafetería, heladería o panadería', 'Cafetería, heladería, panadería o pastelería', 'cafeterías, heladerías y panaderías', 'Cafetería y postres'],
    ['Bar o discoteca', 'Bar, karaoke o discoteca', 'bares y discotecas', 'Bar'],
    ['Hospedaje', 'Hotel o alojamiento', 'hoteles y alojamientos', 'Hospedaje'],
    ['Turismo', 'Turismo o agencia de viajes', 'agencias de turismo', 'Turismo'],
    ['Importadora o zona franca', 'Importadora o tienda de zona franca', 'importadoras y tiendas de zona franca', 'Importadora'],
    ['Ropa y calzado', 'Ropa, calzado o accesorios', 'tiendas de ropa y calzado', 'Ropa y calzado'],
    ['Tecnología', 'Celulares, computadoras o electrónica', 'tiendas de celulares y electrónica', 'Tecnología'],
    ['Supermercado o abarrotes', 'Supermercado, abarrotes o licorería', 'supermercados y tiendas de abarrotes', 'Supermercado'],
    ['Farmacia o salud', 'Farmacia, consultorio o clínica', 'farmacias y clínicas', 'Salud'],
    ['Belleza', 'Salón de belleza, barbería o spa', 'salones de belleza y barberías', 'Belleza'],
    ['Gimnasio o deporte', 'Gimnasio o deporte', 'gimnasios', 'Gimnasio'],
    ['Educación', 'Academia, instituto o cursos', 'academias e institutos', 'Educación'],
    ['Taller o repuestos', 'Taller mecánico, motos o repuestos', 'talleres y repuestos de motos', 'Taller'],
    ['Ferretería o construcción', 'Ferretería o materiales de construcción', 'ferreterías', 'Ferretería'],
    ['Eventos', 'Eventos, decoración o fotografía', 'servicios de eventos', 'Eventos'],
    ['Tienda o comercio', 'Otra tienda o comercio', 'tiendas', 'Tienda'],
    ['Servicios', 'Otros servicios', 'servicios', 'Servicios'],
    ['Otro', 'Otro (escribe cuál)', '', '']];
  var RUBROS = RUBROS_D.map(function (r) { return [r[0], r[1]]; });
  window.MARKI_RUBROS = {}; RUBROS_D.forEach(function (r) { if (r[2]) window.MARKI_RUBROS[r[0]] = r[2]; });
  function rubroDe(v) { return RUBROS_D.filter(function (r) { return r[0] === v; })[0] || [v, v, String(v || '').toLowerCase(), v]; }
  function rubroTexto(ev) { return ev.rubro === 'Otro' && ev.rubroDetalle ? ev.rubroDetalle : rubroDe(ev.rubro)[1]; }
  function textoPregunta(t) { return t; }
  var REDES = ['Facebook', 'Instagram', 'TikTok', 'WhatsApp'];
  var LINKS = [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['maps', 'Google Maps'], ['web', 'Sitio web']];
  var CLAVE = 'radar_uap_v1', CLAVE_CFG = 'marki_cfg', CLAVE_BORRADOR = 'marki_borrador';
  var COBIJA = { lat: -11.0267, lng: -68.7692 };
  var app = document.getElementById('app');
  var E = null, memoria = null, timerStand = null;

  /* ================================================================ utilidades */
  function leer() {
    var vacio = { evals: [], evaluador: '', expertos: { n: 8, cal: {} } };
    try { var t = localStorage.getItem(CLAVE); var d = t ? JSON.parse(t) : vacio; d.expertos = d.expertos || vacio.expertos; return d; }
    catch (e) { return memoria || (memoria = vacio); }
  }
  function escribir(db) {
    try { localStorage.setItem(CLAVE, JSON.stringify(db)); return true; }
    catch (e) { memoria = db; aviso('Este navegador no permite guardar: descarga el respaldo antes de cerrar.', 'err'); return false; }
  }
  function cfg() {
    var c; try { c = JSON.parse(localStorage.getItem(CLAVE_CFG) || '{}'); } catch (e) { c = {}; }
    /* versión en línea: config.js puede traer la hoja de Google para todos los equipos; lo guardado en este equipo manda */
    var base = window.MARKI_CONFIG || {};
    var bu = String(base.hojaUrl || '').trim(), bc = String(base.hojaClave || '').trim();
    if (c.hojaUrl === undefined && bu) { c.hojaUrl = bu; c.hojaClave = bc; c.hojaDesdeConfig = true; }
    /* si el equipo tomó la hoja de config.js y luego config.js cambia (nueva implementación de Apps Script), sigue a config.js */
    else if (c.hojaDesdeConfig && bu && (c.hojaUrl !== bu || c.hojaClave !== bc)) { c.hojaUrl = bu; c.hojaClave = bc; delete c.hojaOk; }
    return c;
  }
  function guardarCfg(c) { try { localStorage.setItem(CLAVE_CFG, JSON.stringify(c)); } catch (e) {} }
  function borrador() { try { var b = JSON.parse(localStorage.getItem(CLAVE_BORRADOR) || 'null'); return b && b.nombre ? b : null; } catch (e) { return null; } }
  function guardarBorrador(ev) { try { if (ev) localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(ev)); else localStorage.removeItem(CLAVE_BORRADOR); } catch (e) {} }
  /* v9.8 · Foto del lugar. Se guarda aparte, en IndexedDB del navegador (localStorage solo admite unos 5 MB).
     La evaluación solo lleva ev.foto (fecha de la foto). Mientras se evalúa, la foto nueva viaja en E._fotoNueva
     y se guarda de verdad al terminar; así, cancelar una corrección no cambia la foto guardada. */
  var FOTOS = {}, fotosListas = null;
  function fotosDB() {
    if (fotosDB.p) return fotosDB.p;
    fotosDB.p = new Promise(function (ok, mal) { try { var r = indexedDB.open('marki_fotos', 1); r.onupgradeneeded = function () { r.result.createObjectStore('fotos'); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { mal(r.error); }; } catch (e) { mal(e); } });
    return fotosDB.p;
  }
  function fotosCargar() {
    return fotosListas || (fotosListas = fotosDB().then(function (db) { return new Promise(function (ok) {
      var c = db.transaction('fotos').objectStore('fotos').openCursor();
      c.onsuccess = function () { var k = c.result; if (k) { if (!FOTOS[k.key]) FOTOS[k.key] = k.value; k.continue(); } else ok(); }; c.onerror = function () { ok(); }; }); }).catch(function () {}));
  }
  function fotoGuardar(id, url) {
    if (!id) return Promise.resolve(); if (url) FOTOS[id] = url; else delete FOTOS[id];
    return fotosDB().then(function (db) { return new Promise(function (ok) { var t = db.transaction('fotos', 'readwrite'), s = t.objectStore('fotos'); if (url) s.put(url, id); else s.delete(id); t.oncomplete = ok; t.onerror = ok; t.onabort = ok; }); }).catch(function () {});
  }
  function fotoDe(ev) { return ev ? (ev._fotoNueva !== undefined ? ev._fotoNueva : (ev.foto && FOTOS[ev.id])) || '' : ''; }
  /* reduce la foto del celular (3 a 5 MB) a unos 20 KB: lado mayor de 560 px y JPEG; así cabe en la hoja de Google */
  function comprimirFoto(file) {
    return new Promise(function (ok, mal) {
      if (!file || !/^image\//.test(file.type || 'image/')) { mal(new Error('El archivo no es una imagen.')); return; }
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        URL.revokeObjectURL(u); var lado = 560, q = 0.72, url = '', W0 = im.naturalWidth, H0 = im.naturalHeight;
        if (!W0 || !H0) { mal(new Error('No se pudo leer la imagen.')); return; }
        for (var i = 0; i < 10; i++) {
          var s = Math.min(1, lado / Math.max(W0, H0)), w = Math.max(1, Math.round(W0 * s)), h = Math.max(1, Math.round(H0 * s)), c = document.createElement('canvas'), x = c.getContext('2d');
          c.width = w; c.height = h; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h); url = c.toDataURL('image/jpeg', q);
          if (url.length <= 30000) break; if (q > 0.5) q = Math.round((q - 0.1) * 100) / 100; else lado = Math.round(lado * 0.82);
        }
        ok(url);
      };
      im.onerror = function () { URL.revokeObjectURL(u); mal(new Error('No se pudo abrir la imagen. Prueba con una foto en JPG o PNG.')); };
      im.src = u;
    });
  }
  /* el cuadro de la marca: la foto del lugar si la hay; si no, la inicial del nombre */
  function avatarHTML(ev) { var f = fotoDe(ev); return f ? '<span class="avatar con-foto"><img src="' + f + '" alt="Foto de ' + esc(ev.nombre) + '"></span>' : '<span class="avatar">' + esc((ev.nombre || '?').charAt(0).toUpperCase()) + '</span>'; }
  /* Seguidores: acepta 2350, 2.350, 2,3 mil, 2.3k, 1,2 M */
  function numSeguidores(t) {
    t = String(t || '').toLowerCase().replace(/\s+/g, ''); if (!t) return null;
    var m = t.match(/^([0-9]+(?:[.,][0-9]+)?)(mil|k|m|millones?)?$/);
    if (m && m[2]) { var base = parseFloat(m[1].replace(',', '.')); return Math.round(base * (m[2] === 'mil' || m[2] === 'k' ? 1e3 : 1e6)); }
    var n = parseInt(t.replace(/[^0-9]/g, ''), 10); return isNaN(n) ? null : n;
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function slug(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(q) { return app.querySelector(q); }
  function $$(q) { return Array.prototype.slice.call(app.querySelectorAll(q)); }
  function aviso(t, tipo) { var a = document.getElementById('aviso'); a.textContent = t; a.className = 'aviso ' + (tipo || ''); a.hidden = false; clearTimeout(aviso.k); aviso.k = setTimeout(function () { a.hidden = true; }, 4200); }
  function f0(x) { return x == null || isNaN(x) ? '–' : String(Math.round(x)); }
  function f1(x) { return x == null || isNaN(x) ? '–' : (Math.round(x * 10) / 10).toFixed(1).replace('.', ','); }
  function f2(x) { return x == null || isNaN(x) ? '–' : (Math.round(x * 100) / 100).toFixed(2).replace('.', ','); }
  function fp(p) { return p == null || isNaN(p) ? '–' : p < 0.001 ? '< 0,001' : p.toFixed(3).replace('.', ','); }
  function fecha(iso) { return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  function hoy(iso) { var a = new Date(iso), b = new Date(); return a.toDateString() === b.toDateString(); }
  function ok(v) { return v === 0 || v === 1 || v === 2; }
  function media(a) { a = a.filter(function (x) { return x != null && !isNaN(x); }); return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : null; }
  function mediana(a) { a = a.filter(function (x) { return x != null && !isNaN(x); }).sort(function (x, y) { return x - y; }); if (!a.length) return null; var m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }
  function minus(t) { t = String(t || ''); return t.charAt(0).toLowerCase() + t.slice(1); }
  function pl(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }
  function tiempoCorto(m) { if (m === 'sin') return 'Sin respuesta en 24 h'; if (m < 60) return m + ' min'; var h = Math.floor(m / 60), r = Math.round(m % 60); return m >= 1440 ? 'Más de 24 h' : h + ' h' + (r ? ' ' + r + ' min' : ''); }
  function dimDe(id) { return DIMS.filter(function (d) { return d.id === id; })[0]; }

  /* ================================================================ estadística */
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); var s = 1.000000000190015;
    for (var j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  function betacf(a, b, x) {
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d; var h = d;
    for (var m = 1; m <= 200; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; var del = d * c; h *= del;
      if (Math.abs(del - 1) < 3e-12) break;
    }
    return h;
  }
  function ibeta(x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function gammaQ(a, x) { /* función gamma incompleta regularizada superior */
    if (x <= 0) return 1;
    if (x < a + 1) { var ap = a, sum = 1 / a, del = sum; for (var n = 0; n < 500; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 3e-14) break; } return 1 - sum * Math.exp(-x + a * Math.log(x) - lgamma(a)); }
    var b = x + 1 - a, c = 1e30, d = 1 / b, h = d;
    for (var i = 1; i < 500; i++) { var an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-30) d = 1e-30; c = b + an / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; var dl = d * c; h *= dl; if (Math.abs(dl - 1) < 3e-14) break; }
    return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
  }
  function rangos(v) {
    var o = v.map(function (x, i) { return [x, i]; }).sort(function (a, b) { return a[0] - b[0]; }), r = new Array(v.length), i = 0;
    while (i < o.length) { var j = i; while (j + 1 < o.length && o[j + 1][0] === o[i][0]) j++; var rk = (i + j) / 2 + 1; for (var k = i; k <= j; k++) r[o[k][1]] = rk; i = j + 1; }
    return r;
  }
  function pearson(x, y) {
    var mx = media(x), my = media(y), sxy = 0, sx = 0, sy = 0;
    for (var i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sx += Math.pow(x[i] - mx, 2); sy += Math.pow(y[i] - my, 2); }
    return sx && sy ? sxy / Math.sqrt(sx * sy) : null;
  }
  /* Spearman: correlación de Pearson entre rangos; p bilateral con la distribución t de Student */
  function spearman(x, y) {
    var n = x.length; if (n < 5) return null;
    var r = pearson(rangos(x), rangos(y)); if (r == null) return null;
    var df = n - 2, t = Math.abs(r) >= 1 ? Infinity : r * Math.sqrt(df / (1 - r * r));
    return { rho: r, n: n, p: isFinite(t) ? ibeta(df / (df + t * t), df / 2, 0.5) : 0 };
  }
  /* Friedman con corrección por empates (Friedman, 1937) */
  function friedman(m) {
    var n = m.length, k = m[0] ? m[0].length : 0; if (n < 3 || k < 2) return null;
    var Rj = new Array(k).fill(0), ties = 0;
    m.forEach(function (fila) {
      var rk = rangos(fila); rk.forEach(function (v, j) { Rj[j] += v; });
      var cnt = {}; fila.forEach(function (v) { cnt[v] = (cnt[v] || 0) + 1; }); Object.keys(cnt).forEach(function (c) { var t = cnt[c]; ties += t * t * t - t; });
    });
    var chi = 12 / (n * k * (k + 1)) * Rj.reduce(function (s, r) { return s + r * r; }, 0) - 3 * n * (k + 1);
    var corr = 1 - ties / (n * k * (k * k - 1)); if (corr > 0) chi /= corr;
    return { chi2: chi, gl: k - 1, p: gammaQ((k - 1) / 2, chi / 2), w: chi / (n * (k - 1)), rangoMedio: Rj.map(function (r) { return r / n; }), n: n };
  }
  /* CCI(2,1): dos vías, efectos aleatorios, acuerdo absoluto, un evaluador (Shrout y Fleiss, 1979) */
  function icc21(m) {
    var n = m.length, k = 2; if (n < 3) return null;
    var gm = media([].concat.apply([], m)), sr = 0, sc = 0, st = 0;
    m.forEach(function (r) { var rm = (r[0] + r[1]) / 2; sr += k * Math.pow(rm - gm, 2); r.forEach(function (x) { st += Math.pow(x - gm, 2); }); });
    [0, 1].forEach(function (j) { var cm = media(m.map(function (r) { return r[j]; })); sc += n * Math.pow(cm - gm, 2); });
    var se = st - sr - sc, msr = sr / (n - 1), msc = sc / (k - 1), mse = se / ((n - 1) * (k - 1));
    var den = msr + (k - 1) * mse + k * (msc - mse) / n;
    return den > 0 ? (msr - mse) / den : null;
  }
  /* Kappa ponderada cuadrática para 0, 1 y 2 (Cohen, 1968) */
  function kappaW(p2) {
    if (p2.length < 10) return null;
    var o = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], n = p2.length, num = 0, den = 0;
    p2.forEach(function (p) { o[p[0]][p[1]]++; });
    var fr = [0, 1, 2].map(function (i) { return o[i][0] + o[i][1] + o[i][2]; }), fc = [0, 1, 2].map(function (j) { return o[0][j] + o[1][j] + o[2][j]; });
    for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) { var w = Math.pow(i - j, 2) / 4; num += w * o[i][j] / n; den += w * fr[i] * fc[j] / (n * n); }
    return den > 0 ? 1 - num / den : null;
  }
  function lecturaICC(x) { return x == null ? 'Faltan datos' : x < 0.5 ? 'Pobre' : x < 0.75 ? 'Moderada' : x < 0.9 ? 'Buena' : 'Excelente'; }
  function lecturaK(x) { return x == null ? 'Faltan datos' : x < 0.2 ? 'Leve' : x < 0.4 ? 'Aceptable' : x < 0.6 ? 'Moderada' : x < 0.8 ? 'Considerable' : 'Casi perfecta'; }

  /* ================================================================ índice */
  function autoNivel(it, datos) {
    var a = it.auto; if (!a || !datos) return undefined;
    if (a.na_si_cero && datos[a.na_si_cero] === 0) return null;
    var v = datos[a.campo];
    if (a.tipo === 'preguntas') { var rg = R.REGLAS && R.REGLAS[it.id]; if (!rg) return undefined;
      return rg.f(v || {}, { rev: datos.rev9 || 9, resenas: datos.resenas }); }
    if (a.tipo === 'checks') {
      if (!v) return undefined;
      /* La ficha de Google sin la casilla «Tiene ficha» es nivel 0, aunque se hayan marcado otras casillas */
      if (a.campo === 'ficha' && v.indexOf(a.opciones[0]) < 0) return 0;
      var c = v.length; return c < a.cortes[0] ? 0 : c < a.cortes[1] ? 1 : 2;
    }
    if (a.tipo === 'tiempo') { if (v === 'sin') return 0; if (v == null || v === '' || isNaN(v)) return undefined; return v < a.cortes[0] ? 2 : v < a.cortes[1] ? 1 : 0; }
    if (v == null || v === '' || isNaN(v)) return undefined;
    return v < a.cortes[0] ? 0 : v < a.cortes[1] ? 1 : 2;
  }
  function puntajes(resp) {
    var dims = {}, vals = [];
    DIMS.forEach(function (d) {
      var s = 0, n = 0; d.items.forEach(function (it) { var v = resp[it.id]; if (ok(v)) { s += v; n++; } });
      dims[d.id] = n ? s / (2 * n) * 100 : null; if (n) vals.push(dims[d.id]);
    });
    return { dims: dims, indice: vals.length ? media(vals) : null,
      completos: ITEMS.filter(function (it) { return resp[it.id] !== undefined; }).length,
      evaluados: ITEMS.filter(function (it) { return ok(resp[it.id]); }).length };
  }
  function nivelDe(x) { if (x == null) return null; var r = Math.round(x), k = 0; R.niveles.forEach(function (n, i) { if (r >= n.min && r <= n.max) k = i; }); return { k: k, n: R.niveles[k] }; }
  var PI = { alto: 3, medio: 2, bajo: 1 }, PE = { bajo: 3, medio: 2, alto: 1 };
  /* Con la evaluación completa (ev), el texto de cada acción usa los datos del propio negocio (redactor.js) */
  var RD = window.MARKI_REDACTOR;
  function recomendaciones(resp, ev) {
    return ITEMS.filter(function (it) { return resp[it.id] === 0 || resp[it.id] === 1; }).map(function (it) {
      var v = resp[it.id], txt = it.rec[v], visto = '';
      if (ev && RD) { try { txt = RD.accion(ev, it.id) || txt; visto = RD.evidencia(ev, it.id); } catch (e) {} }
      return { it: it, v: v, texto: txt, visto: visto, prioridad: PI[it.impacto] * 2 + PE[it.esfuerzo] + (v === 0 ? 1 : 0) };
    }).sort(function (a, b) { return b.prioridad - a.prioridad || a.v - b.v; });
  }
  function fortalezas(resp) { return ITEMS.filter(function (it) { return resp[it.id] === 2; }).sort(function (a, b) { return PI[b.impacto] - PI[a.impacto]; }); }
  function estudio(db, excluir) { return db.evals.filter(function (e) { return e.origen === 'Estudio' && e.id !== excluir; }); }
  function unaPorNegocio(evs) { var v = {}; return evs.slice().sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; }).filter(function (e) { if (v[e.codigo]) return false; v[e.codigo] = 1; return true; }); }
  function referencia(evs) {
    if (evs.length < 3) return null;
    var P = evs.map(function (e) { return puntajes(e.resp); }), dims = {};
    DIMS.forEach(function (d) { dims[d.id] = media(P.map(function (p) { return p.dims[d.id]; })); });
    return { n: evs.length, dims: dims, indices: P.map(function (p) { return p.indice; }), indice: media(P.map(function (p) { return p.indice; })) };
  }
  function pares(db) {
    var g = {}; estudio(db).forEach(function (e) { (g[e.codigo] = g[e.codigo] || []).push(e); });
    var out = []; Object.keys(g).forEach(function (k) { var l = g[k].sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
      for (var i = 1; i < l.length; i++) if (!(l[i].evaluador && l[0].evaluador && l[i].evaluador === l[0].evaluador)) { out.push([l[0], l[i]]); break; } });
    return out;
  }
  function confiabilidad(db) {
    var P = pares(db), ind = [], todos = [], porItem = {};
    P.forEach(function (p) {
      var a = puntajes(p[0].resp).indice, b = puntajes(p[1].resp).indice; if (a != null && b != null) ind.push([a, b]);
      ITEMS.forEach(function (it) { var x = p[0].resp[it.id], y = p[1].resp[it.id]; if (ok(x) && ok(y)) { todos.push([x, y]); (porItem[it.id] = porItem[it.id] || []).push(x === y ? 1 : 0); } });
    });
    return { pares: P.length, icc: icc21(ind), kw: kappaW(todos), acuerdo: ITEMS.map(function (it) { var l = porItem[it.id] || []; return { it: it, n: l.length, pct: l.length ? media(l) * 100 : null }; }),
      acuerdoMedio: todos.length ? media(todos.map(function (p) { return p[0] === p[1] ? 100 : 0; })) : null };
  }

  /* ================================================================ gráficos */
  var COL = ['#D63B3B', '#D9822B', '#1E4AA8', '#0E9F6E'];
  var COL_T = ['#B42323', '#A35406', '#1E4AA8', '#047857']; /* mismos tonos, más oscuros: fondo de texto blanco legible */
  function radarSVG(dims, ref, opt) {
    opt = opt || {};
    var W = opt.w || 360, H = opt.h || 320, cx = W / 2, cy = H / 2 + 6, rad = Math.min(W, H) / 2 - (opt.margen || 58), n = DIMS.length;
    var col = opt.oscuro ? '#7FB2FF' : '#1E4AA8', red = opt.oscuro ? 'rgba(255,255,255,.14)' : '#E3E7EF', txt = opt.oscuro ? '#C9D6F2' : '#2A3345';
    function pt(i, v) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * rad * v / 100, cy + Math.sin(a) * rad * v / 100]; }
    var s = '<svg class="radar" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Gráfico de radar por dimensión">';
    [25, 50, 75, 100].forEach(function (lv) { s += '<polygon points="' + DIMS.map(function (d, i) { return pt(i, lv).join(','); }).join(' ') + '" fill="none" stroke="' + red + '"/>'; });
    DIMS.forEach(function (d, i) { var p = pt(i, 100), l = pt(i, 122), anc = Math.abs(l[0] - cx) < 8 ? 'middle' : l[0] > cx ? 'start' : 'end';
      s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] + '" stroke="' + red + '"/><text x="' + l[0] + '" y="' + (l[1] + 4) + '" text-anchor="' + anc + '" style="fill:' + txt + '">' + esc(d.corto) + '</text>'; });
    if (ref) s += '<polygon points="' + DIMS.map(function (d, i) { return pt(i, ref[d.id] || 0).join(','); }).join(' ') + '" fill="none" stroke="' + (opt.oscuro ? '#fff' : '#0E1525') + '" stroke-opacity=".55" stroke-width="1.6" stroke-dasharray="5 4"/>';
    var org = opt.anim ? ' class="rd-forma" style="transform-origin:' + cx + 'px ' + cy + 'px"' : ''; /* anim: la forma crece desde el centro al abrir la pantalla */
    s += '<g' + org + '><polygon points="' + DIMS.map(function (d, i) { return pt(i, dims[d.id] || 0).join(','); }).join(' ') + '" fill="' + col + '" fill-opacity=".22" stroke="' + col + '" stroke-width="2.4" stroke-linejoin="round"/>';
    DIMS.forEach(function (d, i) { if (dims[d.id] == null) return; var p = pt(i, dims[d.id]); s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.6" fill="' + col + '"/>'; });
    s += '</g>';
    return s + '</svg>';
  }
  function anillo(x, txt, grande) { var nv = nivelDe(x);
    return '<div class="anillo' + (grande ? ' grande' : '') + '" style="--v:' + (x == null ? 0 : Math.round(x)) + ';--c:' + (nv ? COL[nv.k] : '#1E4AA8') + '"><div><span><b>' + f0(x) + '</b><small>' + (txt || 'de 100') + '</small></span></div></div>'; }
  function histograma(vals) {
    var bins = new Array(10).fill(0); vals.forEach(function (v) { if (v != null) bins[Math.min(9, Math.floor(v / 10))]++; });
    var mx = Math.max.apply(null, bins.concat([1])), W = 420, H = 190, bw = (W - 40) / 10;
    var s = '<svg class="graf" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Distribución del índice">';
    bins.forEach(function (c, i) { var h = c / mx * (H - 50), x = 30 + i * bw, y = H - 28 - h, k = nivelDe(i * 10 + 5).k;
      s += '<rect x="' + (x + 2) + '" y="' + y + '" width="' + (bw - 4) + '" height="' + h + '" rx="4" fill="' + COL[k] + '" fill-opacity=".85"/>';
      if (c) s += '<text x="' + (x + bw / 2) + '" y="' + (y - 5) + '" text-anchor="middle" class="v">' + c + '</text>'; });
    for (var t = 0; t <= 100; t += 20) s += '<text x="' + (30 + t / 10 * bw) + '" y="' + (H - 10) + '" text-anchor="middle" class="ax">' + t + '</text>';
    return s + '<line x1="30" y1="' + (H - 28) + '" x2="' + (W - 10) + '" y2="' + (H - 28) + '" stroke="#C9D1DF"/></svg>';
  }
  function dispersion(pts) {
    var W = 420, H = 230, L = 44, B = 34, T = 12, Rr = 12;
    var xs = pts.map(function (p) { return Math.log10(p[0] + 1); }), xmax = Math.max.apply(null, xs.concat([1])), xmin = 0;
    function X(v) { return L + (v - xmin) / (xmax - xmin || 1) * (W - L - Rr); } function Y(v) { return H - B - v / 100 * (H - B - T); }
    var s = '<svg class="graf" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Índice según seguidores">';
    [0, 25, 50, 75, 100].forEach(function (v) { s += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#EEF1F6"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" class="ax">' + v + '</text>'; });
    for (var e = 0; e <= Math.ceil(xmax); e++) s += '<text x="' + X(e) + '" y="' + (H - 14) + '" text-anchor="middle" class="ax">' + (e === 0 ? '0' : Math.pow(10, e) >= 1000 ? Math.pow(10, e) / 1000 + ' mil' : Math.pow(10, e)) + '</text>';
    pts.forEach(function (p, i) { s += '<circle cx="' + X(xs[i]) + '" cy="' + Y(p[1]) + '" r="5" fill="#1E4AA8" fill-opacity=".55" stroke="#1E4AA8"/>'; });
    return s + '<text x="' + ((W + L) / 2) + '" y="' + (H - 1) + '" text-anchor="middle" class="ax">Seguidores en la red principal (escala logarítmica)</text></svg>';
  }
  function colorCelda(v) { if (v == null) return '#F4F6FA'; var k = nivelDe(v).k; return ['#FCE9E9', '#FDF1E3', '#E9EFFB', '#E3F6EE'][k]; }

  /* ================================================================ estructura */
  /* v9.8: logo oficial de Marki (img/): versión clara para fondos oscuros, a color para fondos claros, y la paraba sola */
  var LOGO_BLANCO = '<img class="logo-marca" src="marki-logo-blanco.png" alt="Marki">', LOGO_COLOR = '<img class="logo-marca" src="marki-logo.png" alt="Marki">', LOGO_ICONO = '<img class="logo-icono" src="marki-icono.png" alt="">';
  var LOGO = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 18.5V7.5l7.5 7 7.5-9" stroke="#fff" stroke-width="2.6"/><path d="M19.5 9.5v9" stroke="#fff" stroke-width="2.6" stroke-opacity=".55"/><circle cx="19.5" cy="5.5" r="2.4" fill="#F5B83D"/></svg>';
  var DEMO = 'marki_demo';
  /* Íconos de línea propios (24 × 24) para cada dimensión y para los datos de entrada */
  var ICO = { entrada: '<rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7"/>',
    D1: '<path d="M3.5 12V4.5H11l9 9-7.5 7.5z"/><circle cx="7.6" cy="8.6" r="1.4"/>', D2: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    D3: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 16l-5-5-8 8.5"/>', D4: '<path d="M4 5h16v10H9.5L4 19.5z"/><path d="M8 9.5h8M8 12h5"/>',
    D5: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>', D6: '<path d="M3.5 4.5H6l2.2 10.5h10l2-7.5H7"/><circle cx="9.5" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/>',
    D7: '<path d="M4 10v4h3l7 4V6l-7 4z"/><path d="M17.5 9a4 4 0 010 6M19.8 6.8a7 7 0 010 10.4"/>' };
  function icono(k, t) { return '<svg class="ico" width="' + (t || 22) + '" height="' + (t || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICO[k] || '') + '</svg>'; }
  /* Identificadores de los datos simulados de verificacion/datos_simulados.json: nunca deben mostrarse en la Feria como datos reales */
  var IDS_PRUEBA = ["mw43r9k9ah5xs", "mw43rdwmp3iiz", "mw43rf29qqqhp", "mw43rgd1j0idy", "mw43rhi803tgx", "mw43riotkyd84", "mw43rjvvrg6zv", "mw43rkulgxs8u", "mw43rlzbockqx", "mw43rn3m1unn7", "mw43ro9q1q55s", "mw43rpdj2gzui", "mw43rqmx6xafp", "mw43rrvtrwba2", "mw43rt4aflzsj", "mw43ru9gfb87v", "mw43rvcdr348b", "mw43rwd07r3pz"];
  function dePrueba(db) { return db.evals.filter(function (e) { return IDS_PRUEBA.indexOf(e.id) >= 0; }); }
  function avisoPrueba(db) { var n = dePrueba(db).length; if (!n) return '';
    return '<div class="tarjeta retomar alerta-p"><div><b>Hay ' + pl(n, 'evaluación', 'evaluaciones') + ' de prueba (datos simulados) cargada' + (n === 1 ? '' : 's') + '</b><small>Sirven para practicar, pero no son negocios reales. Bórralas antes de la Feria para que no aparezcan en los resultados ni en el televisor.</small></div><span class="espacio"></span><button class="btn peligro chico" data-borrar-prueba>Borrar datos de prueba</button></div>'; }
  function enlazarPrueba(despues) { $$('[data-borrar-prueba]').forEach(function (b) { b.onclick = function () {
    if (!confirmar(b)) return; var db = leer(); descargar('marki_respaldo_antes_de_borrar_prueba.json', JSON.stringify(db, null, 1));
    var n = dePrueba(db).length; db.evals = db.evals.filter(function (e) { return IDS_PRUEBA.indexOf(e.id) < 0; }); escribir(db); aviso((n === 1 ? 'Se borró ' : 'Se borraron ') + pl(n, 'evaluación', 'evaluaciones') + ' de prueba. Se descargó un respaldo por si acaso.', 'okk'); (despues || ruta)(); }; }); }
  /* Busca una evaluación por id: primero las reales y después el ejemplo de demostración (que nunca entra en las estadísticas) */
  function buscar(id) {
    var ev = leer().evals.filter(function (x) { return x.id === id; })[0]; if (ev) return ev;
    try { return (JSON.parse(localStorage.getItem(DEMO) || '[]')).filter(function (x) { return x.id === id; })[0] || null; } catch (e) { return null; }
  }
  function sinRespaldo(db) { var u = cfg().ultimoRespaldo || '', s = subidos(), hoja = !!hojaUrl(); return db.evals.filter(function (e) { return (e.corregida || e.fecha) > u && !(hoja && s[e.id] && lista(CLAVE_COLA).indexOf(e.id) < 0); }).length; }
  function avisoRespaldo(db) {
    var n = sinRespaldo(db); if (n < 3) return '';
    return '<div class="tarjeta retomar alerta-r"><div><b>Tienes ' + pl(n, 'evaluación', 'evaluaciones') + ' sin respaldo</b><small>Los datos viven solo en este navegador. Descarga un respaldo y guárdalo en una memoria USB o en tu correo.</small></div><span class="espacio"></span><button class="btn pri chico" data-respaldo>Descargar respaldo</button></div>';
  }
  function enlazarRespaldo() { $$('[data-respaldo]').forEach(function (b) { b.onclick = function () { descargarRespaldo(); var c = $('.alerta-r'); if (c) c.remove(); }; }); }
  function descargarRespaldo() { var db = leer(), r = Object.assign({}, db), fo = {}; db.evals.forEach(function (e) { if (e.foto && FOTOS[e.id]) fo[e.id] = FOTOS[e.id]; }); if (Object.keys(fo).length) r.fotos = fo;
    descargar('marki_respaldo_' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json', JSON.stringify(r, null, 1)); var c = cfg(); c.ultimoRespaldo = new Date().toISOString(); guardarCfg(c); aviso('Respaldo descargado: ' + pl(db.evals.length, 'evaluación', 'evaluaciones') + '.', 'okk'); }
  /* ================================================================ v8.1: copia en Google Sheets (opcional)
     Marki guarda primero en este navegador. Si hay una hoja conectada, envía una copia en segundo plano.
     Sin internet, la evaluación queda en espera y se sube sola cuando vuelve la conexión. */
  var CLAVE_COLA = 'marki_cola', CLAVE_SUBIDOS = 'marki_subidos', CLAVE_COLA_EXP = 'marki_cola_exp';
  /* v9.7: borrados que deben salir también de la hoja, borrados que no deben volver, y lo que llegó desde otros equipos */
  var CLAVE_COLA_BORRAR = 'marki_cola_borrar', CLAVE_BORRADOS = 'marki_borrados', CLAVE_DE_HOJA = 'marki_de_hoja';
  function lista(k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } }
  function guardarLista(k, l) { try { localStorage.setItem(k, JSON.stringify(l)); } catch (e) {} }
  function hojaUrl() { var u = (cfg().hojaUrl || '').trim(); return /^https:\/\/script\.google(usercontent)?\.com\//.test(u) ? u : ''; }
  function subidos() { var o = {}; lista(CLAVE_SUBIDOS).forEach(function (id) { o[id] = 1; }); return o; }
  function encolar(ids) { if (!hojaUrl()) return; var c = lista(CLAVE_COLA); ids.forEach(function (id) { if (c.indexOf(id) < 0 && IDS_PRUEBA.indexOf(id) < 0) c.push(id); }); guardarLista(CLAVE_COLA, c); }
  function jsonp(url, params, ms) {
    return new Promise(function (ok, mal) {
      var cb = '_marki' + Date.now() + Math.floor(Math.random() * 1e4), sc = document.createElement('script'), t;
      function fin() { clearTimeout(t); delete window[cb]; sc.remove(); }
      window[cb] = function (d) { fin(); ok(d); };
      sc.onerror = function () { fin(); mal(new Error('Sin respuesta de la hoja. Revisa la dirección y que la implementación permita el acceso a «Cualquier persona».')); };
      t = setTimeout(function () { fin(); mal(new Error('La hoja tardó demasiado en responder.')); }, ms || 15000);
      var q = Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
      sc.src = url + (url.indexOf('?') < 0 ? '?' : '&') + q + '&callback=' + cb; document.head.appendChild(sc);
    });
  }
  /* antes de subir se espera a que las fotos del lugar estén leídas de IndexedDB */
  function subir() { return fotosCargar().then(subirYa); }
  function subirYa() {
    var url = hojaUrl(), cola = lista(CLAVE_COLA);
    if (!url || (!cola.length && !lista(CLAVE_COLA_EXP).length && !lista(CLAVE_COLA_BORRAR).length) || subir.ocupado || navigator.onLine === false) return Promise.resolve(estadoHoja());
    subir.ocupado = true;
    var db = leer(), evs = cola.map(function (id) { return db.evals.filter(function (e) { return e.id === id; })[0]; }).filter(Boolean),
      tabla = tablaAncho(evs), clave = cfg().hojaClave || '';
    var envios = evs.map(function (e, i) {
      return fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ clave: clave, id: e.id, cabecera: tabla[0].concat(['registro_marki']), fila: tabla[i + 1].concat([registroCorto(e)]) }) }).catch(function () {}); });
    /* lo borrado en Marki también sale de la hoja */
    lista(CLAVE_COLA_BORRAR).forEach(function (b) { envios.push(fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ clave: clave, accion: 'borrar', hoja: b.split(':')[0], id: b.split(':').slice(1).join(':') }) }).catch(function () {})); });
    var borrando = lista(CLAVE_COLA_BORRAR);
    return Promise.all(envios).then(function () { return cola.length || borrando.length ? jsonp(url, { accion: 'ids', clave: clave }) : { ok: true, ids: [] }; })
      .then(function (r) {
        if (!r || !r.ok) throw new Error(r && r.error || 'respuesta inválida');
        var en = {}; (r.ids || []).forEach(function (id) { en[id] = 1; });
        var sub = lista(CLAVE_SUBIDOS); cola.forEach(function (id) { if (en[id] && sub.indexOf(id) < 0) sub.push(id); }); guardarLista(CLAVE_SUBIDOS, sub);
        /* las evaluaciones borradas del navegador también salen de la cola */
        var vivas = {}; leer().evals.forEach(function (e) { vivas[e.id] = 1; });
        guardarLista(CLAVE_COLA, lista(CLAVE_COLA).filter(function (id) { return !en[id] && vivas[id]; }));
        /* un borrado queda hecho cuando su id ya no está en la hoja */
        guardarLista(CLAVE_COLA_BORRAR, lista(CLAVE_COLA_BORRAR).filter(function (b) { return borrando.indexOf(b) < 0 || (b.indexOf('Evaluaciones:') === 0 && !!en[b.slice(13)]); }));
        var c = cfg(); c.hojaUltima = new Date().toISOString(); c.hojaError = ''; guardarCfg(c);
      })
      .catch(function (e) { var c = cfg(); c.hojaError = String(e && e.message || e).slice(0, 200); guardarCfg(c); })
      .then(function () { return subirExpertos(); })
      .then(function () { subir.ocupado = false; pintarEstadoHoja(); return estadoHoja(); });
  }
  /* Respuestas de los expertos: una fila por experto en la pestaña «Expertos» de la misma hoja */
  function tablaExpertos(A, nums) {
    var cab0 = ['id', 'experto', 'nombre_profesion'].concat(ITEMS.reduce(function (a, it) { return a.concat(['relevancia_' + it.id, 'claridad_' + it.id]); }, []))
      .concat(DIMS.map(function (d) { return 'suficiencia_' + d.id; })).concat(DIMS.map(function (d) { return 'comentario_' + d.id; }));
    return [cab0].concat(nums.map(function (e) {
      return [A.ids[e], 'E' + e, A.nombres[e] || ''].concat(ITEMS.reduce(function (a, it) { return a.concat([(A.r[it.id] || {})[e] || '', (A.c[it.id] || {})[e] || '']); }, []))
        .concat(DIMS.map(function (d) { return (A.s[d.id] || {})[e] || ''; })).concat(DIMS.map(function (d) { return (A.com[d.id] || {})[e] || ''; })); }));
  }
  /* una celda de Google Sheets admite 50 000 caracteres: si una evaluación trae textos muy largos, se envían sin ellos */
  function registroCorto(e) {
    /* la foto del lugar (unos 20 KB) viaja dentro del registro para que el stand y el docente también la vean; si no cabe, se envía sin ella */
    var f = e.foto && FOTOS[e.id], j = f ? JSON.stringify(Object.assign({}, e, { fotoDatos: f })) : ''; if (j && j.length < 45000) return j;
    j = JSON.stringify(e); if (j.length < 45000) return j;
    var x = JSON.parse(j); if (x.datos) { Object.keys(x.datos).forEach(function (k) { if (typeof x.datos[k] === 'string' && x.datos[k].length > 500) x.datos[k] = x.datos[k].slice(0, 500); }); }
    if (x.google) delete x.google.resenas; j = JSON.stringify(x); return j.length < 45000 ? j : ''; }
  function registroExperto(A, e) {
    var x = { id: A.ids[e], nombre: A.nombres[e] || '', r: {}, c: {}, s: {}, com: {} };
    ITEMS.forEach(function (it) { if ((A.r[it.id] || {})[e]) x.r[it.id] = A.r[it.id][e]; if ((A.c[it.id] || {})[e]) x.c[it.id] = A.c[it.id][e]; });
    DIMS.forEach(function (d) { if ((A.s[d.id] || {})[e]) x.s[d.id] = A.s[d.id][e]; if ((A.com[d.id] || {})[e]) x.com[d.id] = A.com[d.id][e]; });
    return x;
  }
  /* borrar en Marki: no vuelve a aparecer desde la hoja y, si hay hoja, también se borra allí */
  function marcarBorrado(hoja, id) {
    if (!id) return; var bo = lista(CLAVE_BORRADOS); if (bo.indexOf(id) < 0) { bo.push(id); guardarLista(CLAVE_BORRADOS, bo.slice(-2000)); }
    if (hojaUrl()) { var c = lista(CLAVE_COLA_BORRAR), k = hoja + ':' + id; if (c.indexOf(k) < 0) { c.push(k); guardarLista(CLAVE_COLA_BORRAR, c); } }
  }
  function encolarExperto(e) {
    if (!hojaUrl()) return; var db = leer(), A = datosAiken(db); A.ids = A.ids || {};
    if (!A.ids[e]) { A.ids[e] = 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); escribir(db); }
    var c = lista(CLAVE_COLA_EXP); if (c.indexOf(A.ids[e]) < 0) { c.push(A.ids[e]); guardarLista(CLAVE_COLA_EXP, c); }
  }
  function subirExpertos() {
    var url = hojaUrl(), cola = lista(CLAVE_COLA_EXP); if (!url || !cola.length) return Promise.resolve();
    var A = datosAiken(leer()), inv = {}; Object.keys(A.ids || {}).forEach(function (e) { inv[A.ids[e]] = +e; });
    var nums = cola.map(function (id) { return inv[id]; }).filter(function (e) { return e; }), tabla = tablaExpertos(A, nums), clave = cfg().hojaClave || '';
    return Promise.all(nums.map(function (e, i) { return fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ clave: clave, hoja: 'Expertos', id: A.ids[e], cabecera: tabla[0].concat(['registro_marki']), fila: tabla[i + 1].concat([JSON.stringify(registroExperto(A, e))]) }) }).catch(function () {}); }))
      .then(function () { return jsonp(url, { accion: 'ids', hoja: 'Expertos', clave: clave }); })
      .then(function (r) { if (!r || !r.ok) throw new Error(r && r.error || 'respuesta inválida');
        var en = {}; (r.ids || []).forEach(function (id) { en[id] = 1; });
        guardarLista(CLAVE_COLA_EXP, lista(CLAVE_COLA_EXP).filter(function (id) { return !en[id] && inv[id]; })); })
      .catch(function (e) { var c = cfg(); c.hojaError = String(e && e.message || e).slice(0, 200); guardarCfg(c); });
  }
  var tSubir; function subirPronto() { clearTimeout(tSubir); tSubir = setTimeout(subir, 2500); }
  /* v9.7 · Traer desde la hoja lo que se guardó en OTROS equipos (celulares de los estudiantes).
     Solo funciona en los equipos que tienen la clave de lectura (el del stand y el del docente).
     Lo que este equipo aún no subió no se pisa; lo borrado aquí no vuelve. */
  function bajar() {
    var url = hojaUrl(), c = cfg(); if (!url || !c.hojaLectura || bajar.ocupado || navigator.onLine === false) return Promise.resolve(0);
    bajar.ocupado = true; var clave = c.hojaClave || '', cambios = 0;
    var pedir = function (hoja) { return jsonp(url, { accion: 'registros', hoja: hoja, clave: clave, lectura: c.hojaLectura }, 30000).then(function (r) {
      if (!r || !r.ok) throw new Error(r && r.error || 'respuesta inválida'); if (r.hoja && /^https:\/\/docs\.google\.com\//.test(r.hoja)) enlaceHoja(r.hoja); return (r.registros || []).map(function (t) { try { return JSON.parse(t); } catch (e) { return null; } }).filter(Boolean); }); };
    return fotosCargar().then(function () { return pedir('Evaluaciones'); }).then(function (regs) {
      var db = leer(), pos = {}, bo = {}, pend = {}, deHoja = lista(CLAVE_DE_HOJA), enHoja = {}, sub = lista(CLAVE_SUBIDOS);
      lista(CLAVE_BORRADOS).forEach(function (id) { bo[id] = 1; }); lista(CLAVE_COLA).forEach(function (id) { pend[id] = 1; });
      db.evals.forEach(function (e, i) { pos[e.id] = i; });
      regs.forEach(function (e) {
        if (!e.id || !e.resp || IDS_PRUEBA.indexOf(e.id) >= 0) return; enHoja[e.id] = 1;
        var fd = e.fotoDatos; delete e.fotoDatos;
        if (bo[e.id] || pend[e.id]) return;
        /* foto del lugar que llegó desde otro equipo */
        if (e.foto && fd && FOTOS[e.id] !== fd && /^data:image\/(jpeg|png|webp);base64,/.test(fd)) { fotoGuardar(e.id, fd); cambios++; }
        else if (!e.foto && FOTOS[e.id] && pos[e.id] != null) { fotoGuardar(e.id, null); cambios++; }
        if (pos[e.id] == null) { db.evals.push(e); pos[e.id] = db.evals.length - 1; cambios++; if (deHoja.indexOf(e.id) < 0) deHoja.push(e.id); }
        else if (JSON.stringify(db.evals[pos[e.id]]) !== JSON.stringify(e)) { db.evals[pos[e.id]] = e; cambios++; }
        if (sub.indexOf(e.id) < 0) sub.push(e.id);
      });
      /* lo que llegó de otro equipo y ya no está en la hoja (lo borraron allá) se quita también aquí */
      var antes = db.evals.length; db.evals = db.evals.filter(function (e) { var queda = deHoja.indexOf(e.id) < 0 || enHoja[e.id] || pend[e.id]; if (!queda) fotoGuardar(e.id, null); return queda; }); cambios += antes - db.evals.length;
      guardarLista(CLAVE_DE_HOJA, deHoja.filter(function (id) { return enHoja[id]; })); guardarLista(CLAVE_SUBIDOS, sub);
      if (cambios) escribir(db);
      return pedir('Expertos');
    }).then(function (regs) {
      var db = leer(), A = datosAiken(db), bo = {}, pend = {}, hubo = false; A.ids = A.ids || {};
      lista(CLAVE_BORRADOS).forEach(function (id) { bo[id] = 1; }); lista(CLAVE_COLA_EXP).forEach(function (id) { pend[id] = 1; });
      var usado = function (e) { return !!A.nombres[e] || ITEMS.some(function (it) { return (A.r[it.id] || {})[e] || (A.c[it.id] || {})[e]; }); };
      regs.forEach(function (x) {
        if (!x.id || bo[x.id] || pend[x.id]) return;
        var e = 0; Object.keys(A.ids).forEach(function (k) { if (A.ids[k] === x.id) e = +k; });
        if (!e) { for (var k = 1; k <= A.n && !e; k++) if (!usado(k) && !A.ids[k]) e = k; if (!e) { if (A.n >= 10) return; A.n++; e = A.n; } }
        var antes = JSON.stringify(registroExperto(A, e)); A.ids[e] = x.id; A.nombres[e] = x.nombre || '';
        ITEMS.forEach(function (it) { (A.r[it.id] = A.r[it.id] || {})[e] = (x.r || {})[it.id] || undefined; (A.c[it.id] = A.c[it.id] || {})[e] = (x.c || {})[it.id] || undefined; });
        DIMS.forEach(function (d) { (A.s[d.id] = A.s[d.id] || {})[e] = (x.s || {})[d.id] || undefined; (A.com[d.id] = A.com[d.id] || {})[e] = (x.com || {})[d.id] || undefined; });
        if (antes !== JSON.stringify(registroExperto(A, e))) hubo = true;
      });
      if (hubo) { escribir(JSON.parse(JSON.stringify(db))); cambios++; }
      var c2 = cfg(); c2.hojaLeida = new Date().toISOString(); c2.hojaErrorLectura = ''; guardarCfg(c2);
    }).catch(function (e) { var c2 = cfg(); c2.hojaErrorLectura = String(e && e.message || e).slice(0, 200); guardarCfg(c2); })
      .then(function () {
        bajar.ocupado = false; pintarEstadoHoja();
        /* si llegó algo nuevo, se actualiza la pantalla de resultados, expertos o inicio (la del stand se actualiza sola) */
        var v = (location.hash.slice(1).split('/')[0]) || 'inicio', foco = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
        if (cambios && !foco && ['panel', 'expertos', 'inicio'].indexOf(v) >= 0) ir(v, null, true);
        if (cambios && document.body.classList.contains('oscuro') && vStand.nuevo) vStand.nuevo(); /* el televisor anuncia el diagnóstico que llegó de un celular */
        return cambios; });
  }
  function estadoHoja() { var c = cfg(); return { url: hojaUrl(), pendientes: lista(CLAVE_COLA).length + lista(CLAVE_COLA_EXP).length + lista(CLAVE_COLA_BORRAR).length, ultima: c.hojaUltima || '', error: c.hojaError || '', lectura: !!c.hojaLectura, leida: c.hojaLeida || '', errorLectura: c.hojaErrorLectura || '' }; }
  function textoEstadoHoja() {
    var e = estadoHoja(); if (!e.url) return '';
    var hora = e.ultima ? new Date(e.ultima).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
    if (e.pendientes) return '<span class="hoja-est pend">Google Sheets: ' + e.pendientes + (e.pendientes === 1 ? ' registro espera' : ' registros esperan') + ' conexión para subir' + (e.error && navigator.onLine !== false ? ' (' + esc(e.error) + ')' : '') + '</span>' + botonHoja();
    var lect = !e.lectura ? '' : e.errorLectura && navigator.onLine !== false ? ' · no se pudo traer lo de otros equipos (' + esc(e.errorLectura) + ')' :
      e.leida ? ' · datos de otros equipos al día (' + new Date(e.leida).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) + ')' : ' · trayendo datos de otros equipos…';
    return '<span class="hoja-est ok">Google Sheets: todo subido' + (hora ? ' · última subida ' + hora : '') + lect + '</span>' + botonHoja();
  }
  /* enlace para abrir la hoja de Google: lo da el propio Apps Script; solo se guarda en el equipo del docente y del stand (los que prueban la conexión o traen datos) */
  function enlaceHoja(u) { var x = cfg(); if (x.hojaEnlace !== u) { x.hojaEnlace = u; guardarCfg(x); pintarEstadoHoja(); } }
  function botonHoja() { var u = cfg().hojaEnlace; return u && hojaUrl() ? ' <a class="btn sec chico hoja-abrir" href="' + esc(u) + '" target="_blank" rel="noopener">Abrir la hoja de Google</a>' : ''; }
  function pintarEstadoHoja() { $$('[data-hoja-est]').forEach(function (x) { x.innerHTML = textoEstadoHoja(); }); }
  window.addEventListener('online', function () { subir().then(bajar); });
  /* cada minuto: sube lo pendiente y trae lo de otros equipos (si este equipo tiene la clave de lectura) */
  setInterval(function () { subir().then(bajar); }, 60000); setTimeout(function () { subir().then(bajar); }, 1500);
  setInterval(function () { if (document.body.classList.contains('oscuro')) bajar(); }, 20000); /* en el televisor del stand, cada 20 segundos */
  function cab(v) {
    var nav = [['inicio', 'Inicio'], ['nueva', 'Evaluar'], ['panel', 'Resultados'], ['expertos', 'Investigación'], ['stand', 'Pantalla del stand']].map(function (n) {
      return '<a data-ir="' + n[0] + '"' + (v === n[0] ? ' class="act"' : '') + '>' + n[1] + '</a>'; }).join('');
    return '<header class="cab"><div class="marca" data-ir="inicio" style="cursor:pointer" title="Ir al inicio">' + LOGO_BLANCO + '<small>UAP · Marketing Digital<br>Ingeniería Comercial</small></div><nav>' + nav + '</nav></header>';
  }
  function enlazar() { $$('[data-ir]').forEach(function (a) { a.onclick = function () { ir(a.getAttribute('data-ir')); }; }); }
  /* Cada pantalla queda en la dirección (#panel, #informe/ID…): el botón Atrás y el refresco funcionan */
  function ir(v, arg, sinHistorial) {
    /* al cambiar de pantalla se cierra cualquier ventana abierta (por ejemplo, «Enviar al dueño») */
    document.querySelectorAll('.modal-f').forEach(function (x) { x.remove(); }); document.body.style.overflow = '';
    clearInterval(timerStand); (vRevelar.t || []).forEach(clearTimeout); document.body.classList.remove('oscuro'); document.body.classList.remove('revelar'); document.onkeydown = null; window.scrollTo(0, 0);
    var h = v === 'inicio' ? '' : v + (arg ? '/' + arg : '');
    if (!sinHistorial && location.hash.slice(1) !== h) { try { history.pushState(null, '', h ? '#' + h : location.pathname); } catch (e) {} }
    if (v === 'nueva') vDatos(); else if (v === 'panel') vPanel(); else if (v === 'informe') vInforme(arg); else if (v === 'kit') vKit(arg); else if (v === 'expertos') vExpertos(); else if (v === 'experto') vResponder();
    else if (v === 'stand') vStand(); else if (v === 'formulario') vFormulario(); else if (v === 'config') vConfig(); else if (v === 'preparar') vPreparar(); else vInicio();
  }

  /* ================================================================ inicio */
  function vInicio() {
    var db = leer(), ref = referencia(unaPorNegocio(estudio(db))), feria = db.evals.filter(function (e) { return e.origen === 'Feria'; });
    var ej = { D1: 70, D2: 45, D3: 80, D4: 50, D5: 35, D6: 60, D7: 20 };
    app.innerHTML = cab('inicio') + '<main>' + avisoPrueba(db) + avisoRespaldo(db) + '<section class="hero"><div>' + '<img class="logo-hero" src="marki-logo.png" alt="Marki">' +
      '<span class="eyebrow">Diagnóstico gratuito de presencia digital para negocios de Cobija</span>' +
      '<h1>¿Tu negocio aparece cuando un cliente lo busca?</h1>' +
      '<p class="lead">Revisamos lo que un cliente ve de tu negocio en Google, en las redes sociales y en la inteligencia artificial, y te entregamos tu nivel, tus fortalezas, un plan de mejora para los próximos 30 días y un kit listo para usar.</p>' +
      '<div class="fila"><button class="btn pri grande" data-ir="nueva">Evaluar una marca</button><button class="btn sec grande" id="demo">▶ Ver una demostración</button></div>' +
      '<div class="stats">' + (ref || feria.length ? (ref ? '<div><b>' + ref.n + '</b><small>negocios en el estudio</small></div><div><b>' + f0(ref.indice) + '</b><small>índice promedio de Cobija</small></div>' : '<div><b>21</b><small>indicadores revisados</small></div>') + '<div><b>' + feria.length + '</b><small>' + (feria.length === 1 ? 'diagnóstico' : 'diagnósticos') + ' en la Feria</small></div>'
        : '<div><b>21</b><small>indicadores revisados</small></div><div><b>7</b><small>dimensiones de la presencia digital</small></div><div><b>0 Bs</b><small>costo para el negocio</small></div>') + '</div>' +
      '</div><div class="muestra" aria-hidden="true"><div class="top"><div><b>Ejemplo de diagnóstico</b><br><small>Datos ilustrativos</small></div><span class="pill">Nivel Intermedio · 51</span></div>' +
      radarSVG(ej, { D1: 45, D2: 40, D3: 50, D4: 40, D5: 30, D6: 45, D7: 15 }, { oscuro: true, w: 380, h: 330, anim: true }) +
      '<div class="leyenda" style="color:#C9D6F2"><span><i style="background:#7FB2FF"></i>Marca evaluada</span><span><i class="c" style="border-color:#fff"></i>Promedio de Cobija</span></div></div></section>' +
      '<section class="como"><h2>Cómo funciona</h2><div class="pasos3">' +
      '<div><i>1</i><b>Buscamos tu marca</b><p>En Google Maps, Facebook, Instagram, TikTok, la Biblioteca de anuncios de Meta y ChatGPT, como lo haría un cliente.</p></div>' +
      '<div><i>2</i><b>Marki decide con reglas fijas</b><p>Tú anotas lo que ves: datos, textos de publicaciones y respuestas de sí o no. Marki aplica la regla de cada uno de los 21 indicadores y asigna el nivel.</p></div>' +
      '<div><i>3</i><b>Te llevas tu plan y tu kit</b><p>Nivel de 0 a 100, comparación con Cobija, un simulador de mejoras, un kit con códigos QR y textos listos, y puedes preguntarle a Marki sobre tu resultado.</p></div></div></section>' +
      '<section class="dims">' + DIMS.map(function (d) { return '<div><span class="dim-ic">' + icono(d.id, 20) + '</span><em>' + d.id + '</em><b>' + esc(d.nombre) + '</b><small>' + esc(d.pregunta) + '</small></div>'; }).join('') + '</section>' +
      '<section class="accesos"><button data-ir="preparar" class="destacado"><b>Preparar la Feria</b><small>Revisión antes de abrir el stand</small></button><button data-ir="expertos"><b>Investigación</b><small>Expertos (V de Aiken), opinión de los dueños y confiabilidad</small></button><button data-ir="formulario"><b>Rúbrica imprimible</b><small>Formulario para expertos y capacitación</small></button><button data-ir="stand"><b>Pantalla del stand</b><small>Resultados en vivo para el televisor</small></button><button data-ir="config"><b>Configuración</b><small>Copia en Google Sheets y búsqueda en Google Maps</small></button></section>' +
      '<p class="nota" style="margin-top:28px">Universidad Amazónica de Pando · Carrera de Ingeniería Comercial · Marketing Digital (ICOM261). Rúbrica versión ' + esc(R.version) + '. ' + (cfg().hojaUrl ? 'Los datos se guardan en este equipo y se copian en la hoja de Google conectada.' : 'Los datos se guardan solo en este equipo.') + '</p></main>';
    enlazar(); enlazarRespaldo(); enlazarPrueba(); $('#demo').onclick = crearDemo;
  }

  /* ================================================================ paso 1: datos */
  function nuevaEval(db) {
    return { id: uid(), fecha: new Date().toISOString(), nombre: '', rubro: '', red: '', evaluador: '', origen: 'Feria', consentimiento: false,
      seguidores: null, links: {}, datos: {}, resp: {}, auto: {}, notas: {}, version: R.version, estimacion: null, google: null };
  }
  /* pre: evaluación que se está corrigiendo o borrador que se retoma (vuelve desde la rúbrica sin perder lo calificado) */
  function vDatos(pre) {
    document.onkeydown = null;
    var db = leer(), b = pre ? null : borrador();
    E = pre || nuevaEval(db);
    var c = cfg(), conGoogle = !!c.googleKey, editando = !!E.editando;
    var sel = function (lista, val, attr) { return lista.map(function (r) { var v = attr ? r[0] : r, t = attr ? r[1] : r; return '<button class="chip' + (val === v ? ' on' : '') + '"' + (attr ? ' data-o="' + v + '"' : '') + '>' + esc(t) + '</button>'; }).join(''); };
    app.innerHTML = cab('nueva') + '<main style="max-width:900px"><ol class="pasos"><li class="act"><b>1</b>Datos de la marca</li><li><b>2</b>Rúbrica</li><li><b>3</b>Diagnóstico</li></ol>' +
      (b ? '<div class="tarjeta retomar"><div><b>Hay una evaluación sin terminar: ' + esc(b.nombre) + '</b><small>' + Object.keys(b.resp || {}).length + ' de ' + ITEMS.length + ' indicadores calificados' + (b.evaluador ? ' · evaluador ' + esc(b.evaluador) : '') + '</small></div><span class="espacio"></span><button class="btn sec chico" id="descartar">Descartar</button><button class="btn pri chico" id="retomar">Retomar</button></div>' : '') +
      (editando ? '<div class="tarjeta retomar"><div><b>Corrigiendo la evaluación de ' + esc(E.nombre) + '</b><small>Los cambios reemplazan la evaluación guardada del ' + fecha(E.fecha) + '.</small></div></div>' : '') +
      '<div class="tarjeta"><h2>Datos de la marca</h2><p class="sub">Escribe el nombre como aparece en sus redes. Los enlaces son opcionales, pero hacen la revisión más rápida y quedan como evidencia.</p>' +
      '<div class="fila fila-arriba"><label class="campo" style="flex:2"><b>Nombre del negocio o marca</b><input type="text" id="nom" autocomplete="off" placeholder="Por ejemplo: Heladería Los Andes" value="' + esc(E.nombre) + '"></label>' +
      '</div>' +
      (conGoogle ? '<div class="g-box"><button class="btn sec" id="gbus"><span class="g-ico">G</span> Buscar el negocio en Google Maps</button><span class="nota" style="margin:0">Trae la ficha, las reseñas, la calificación, el horario, el teléfono y el sitio web.</span><div id="gres"></div></div>'
        : '<p class="nota" style="margin-top:8px">Puedes activar la búsqueda automática en Google Maps en <a data-ir="config" style="cursor:pointer">Configuración</a>.</p>') +
      '<div id="gsel">' + (E.google ? fichaGoogle(E.google) : '') + '</div>' +
      '<div class="bloque-f"><b>Rubro</b><div class="chips rubros" id="rub">' + sel(RUBROS, E.rubro, true) + '</div>' +
      '<label class="campo" id="rubOtro"' + (E.rubro === 'Otro' ? '' : ' hidden') + ' style="margin-top:10px;max-width:420px"><b>¿Qué rubro es?</b><input type="text" id="rubDet" maxlength="60" placeholder="Por ejemplo: venta de castaña" value="' + esc(E.rubroDetalle || '') + '"></label></div>' +
      '<div class="fila"><div class="bloque-f" style="flex:2"><b>Red social principal <small>(la que tiene más seguidores)</small></b><div class="chips" id="red">' + sel(REDES, E.red) + '</div></div>' +
      '<label class="campo" style="margin-top:16px"><b>Seguidores en esa red</b><input type="text" id="seg" placeholder="Por ejemplo: 2350 o 2,3 mil" value="' + (E.seguidores == null ? '' : E.seguidores) + '"><small id="segv"></small></label></div>' +
      '<details class="enlaces"' + (Object.keys(E.links).length ? ' open' : '') + '><summary>Enlaces del negocio (opcional)</summary><div class="grid2">' + LINKS.map(function (l) { return '<label class="campo"><b>' + l[1] + '</b><input type="text" data-link="' + l[0] + '" placeholder="https://" value="' + esc(E.links[l[0]] || '') + '"></label>'; }).join('') +
      '<label class="campo"><b>WhatsApp</b><input type="text" data-link="whatsapp" inputmode="tel" placeholder="Número con código de país, por ejemplo 591 7xxxxxxx" value="' + esc(E.links.whatsapp || '') + '"></label></div></details>' +
      '<div class="bloque-f foto-f"><b>Foto del lugar <small>(opcional)</small></b><div class="foto-fila"><div class="foto-caja" id="fotoCaja"></div><div class="foto-der">' +
      '<div class="foto-btns"><button type="button" class="btn sec chico" id="fotoCam">Tomar foto</button><button type="button" class="btn sec chico" id="fotoGal">Elegir una imagen</button><button type="button" class="btn sec chico peligro-t" id="fotoQuitar" hidden>Quitar la foto</button></div>' +
      '<small class="nota" style="margin:8px 0 0">Fotografía la fachada, el letrero o el interior del local, <b>con permiso del responsable</b>. Procura que no salgan personas. La foto aparece en el diagnóstico, en el kit y en el PDF; no se muestra en la pantalla del stand.</small></div></div>' +
      '<input type="file" id="fotoInCam" accept="image/*" capture="environment" hidden><input type="file" id="fotoInGal" accept="image/*" hidden></div>' +
      '<div class="bloque-f"><b>Tipo de evaluación</b><div class="chips" id="ori">' + sel([['Feria', 'Feria (el responsable está presente)'], ['Estudio', 'Estudio (muestra de la investigación)']], E.origen, true) + '</div></div>' +
      '<div id="feria-x"><label class="check" id="lcons"><input type="checkbox" id="cons"' + (E.consentimiento ? ' checked' : '') + '><span>El responsable del negocio <b>autoriza el diagnóstico</b> y que sus resultados se usen de forma anónima y agrupada con fines académicos.</span></label>' +
      '<div class="estim"><div><b>Antes de empezar, pregunta al dueño:</b> «Del 0 al 100, ¿qué puntaje crees que tiene tu negocio en internet?»<small>Opcional. Al final se compara lo que cree con lo que muestra su presencia digital.</small></div>' +
      '<div class="estim-c"><input type="range" min="0" max="100" step="5" id="est" aria-label="Puntaje que el dueño cree tener, de 0 a 100" value="' + (E.estimacion == null ? 50 : E.estimacion) + '"' + (E.estimacion == null ? ' class="sin"' : '') + '><output id="estv">' + (E.estimacion == null ? '—' : E.estimacion) + '</output><button class="btn sec chico" id="estx">Sin respuesta</button></div></div></div>' +
      '<div class="acciones"><button class="btn sec" id="cancelar">Cancelar</button><span class="espacio"></span><button class="btn pri" id="sig" disabled>' + (Object.keys(E.resp).length ? 'Seguir con la rúbrica' : 'Empezar la evaluación') + '</button></div><p class="nota" id="dup"></p></div></main>';
    enlazar();
    if (b) { $('#retomar').onclick = function () { E = b; vRubrica(); }; $('#descartar').onclick = function () { guardarBorrador(null); vDatos(); }; }
    $('#cancelar').onclick = function () { if (editando) ir('informe', E.id); else { if (Object.keys(E.resp).length) guardarBorrador(E); ir('inicio'); } };
    var grupo = function (id, campo) { $('#' + id).onclick = function (e) { var bt = e.target.closest('.chip'); if (!bt) return; $$('#' + id + ' .chip').forEach(function (x) { x.classList.remove('on'); }); bt.classList.add('on'); E[campo] = bt.dataset.o || bt.textContent; validar(); }; };
    grupo('rub', 'rubro'); grupo('red', 'red'); grupo('ori', 'origen');
    var est = $('#est');
    est.oninput = function () { E.estimacion = +est.value; est.classList.remove('sin'); $('#estv').textContent = est.value; };
    $('#estx').onclick = function () { E.estimacion = null; est.classList.add('sin'); $('#estv').textContent = '—'; };
    var validar = function () {
      E.nombre = $('#nom').value.trim();
      E.seguidores = numSeguidores($('#seg').value);
      $('#segv').textContent = E.seguidores != null && /[^0-9]/.test($('#seg').value.trim()) ? '= ' + E.seguidores.toLocaleString('es-BO') + ' seguidores' : '';
      $$('[data-link]').forEach(function (i) { var v = i.value.trim(); if (v) E.links[i.dataset.link] = v; else delete E.links[i.dataset.link]; });
      $('#feria-x').style.display = E.origen === 'Feria' ? '' : 'none';
      E.consentimiento = E.origen === 'Feria' ? $('#cons').checked : null;
      if (E.origen !== 'Feria') E.estimacion = null;
      var prev = E.nombre ? leer().evals.filter(function (x) { return x.codigo === slug(E.nombre) && x.id !== E.id; }) : [];
      $('#dup').textContent = prev.length ? 'Esta marca ya tiene ' + prev.length + ' evaluación(es). Si es la segunda evaluación del estudio, debe hacerla otra persona sin ver la primera.' : '';
      $('#rubOtro').hidden = E.rubro !== 'Otro'; E.rubroDetalle = E.rubro === 'Otro' ? $('#rubDet').value.trim() : '';
      $('#sig').disabled = !(E.nombre && E.rubro && (E.rubro !== 'Otro' || E.rubroDetalle) && E.red && (E.origen !== 'Feria' || E.consentimiento));
    };
    $$('input').forEach(function (i) { if (i.id === 'est') return; i.oninput = validar; i.onchange = validar; });
    /* foto del lugar: se reduce en el propio celular y se guarda al terminar la evaluación */
    var pintarFoto = function () { var f = fotoDe(E); $('#fotoCaja').innerHTML = f ? '<img src="' + f + '" alt="Foto del lugar">' : '<span>Sin foto</span>'; $('#fotoCaja').classList.toggle('vacia', !f); $('#fotoQuitar').hidden = !f; $('#fotoCam').textContent = f ? 'Tomar otra foto' : 'Tomar foto'; };
    var recibirFoto = function (inp) { var f = inp.files && inp.files[0]; inp.value = ''; if (!f) return; $('#fotoCaja').innerHTML = '<span>Preparando la foto…</span>';
      comprimirFoto(f).then(function (url) { E._fotoNueva = url; pintarFoto(); if (Object.keys(E.resp).length && !E.editando) guardarBorrador(E); }).catch(function (e) { pintarFoto(); aviso(e.message, 'err'); }); };
    $('#fotoCam').onclick = function () { $('#fotoInCam').click(); }; $('#fotoGal').onclick = function () { $('#fotoInGal').click(); };
    $('#fotoInCam').onchange = function () { recibirFoto(this); }; $('#fotoInGal').onchange = function () { recibirFoto(this); };
    $('#fotoInCam').oninput = $('#fotoInGal').oninput = null;
    $('#fotoQuitar').onclick = function () { E._fotoNueva = ''; pintarFoto(); };
    pintarFoto();
    $('#sig').onclick = function () { E.codigo = slug(E.nombre); vRubrica(); };
    if (conGoogle) $('#gbus').onclick = function () { buscarEnGoogle($('#nom').value.trim()); };
    validar(); enlazarQuitar(); if (!pre) $('#nom').focus();
  }

  /* ================================================================ búsqueda en Google Maps (opcional, con clave propia) */
  function fichaGoogle(g) {
    return '<div class="g-ficha"><span class="g-ico grande">G</span><div><b>' + esc(g.nombre) + '</b><small>' + esc(g.direccion || '') + '</small>' +
      '<div class="g-datos">' + (g.n ? '<span>★ ' + f1(g.rating) + ' · ' + pl(g.n, 'reseña', 'reseñas') + '</span>' : '<span>Sin reseñas</span>') + (g.horario ? '<span>Horario</span>' : '') + (g.telefono ? '<span>' + esc(g.telefono) + '</span>' : '') + (g.web ? '<span>Sitio web</span>' : '') + (g.fotos ? '<span>' + pl(g.fotos, 'foto', 'fotos') + '</span>' : '') + '</div>' +
      '<small class="gris">Datos traídos de Google el ' + fecha(g.fecha) + '. Se usan en D2.1, D5.1 y D5.2; revísalos en la rúbrica.</small></div><button class="btn sec chico" id="gquitar">Quitar</button></div>';
  }
  function cargarMaps(key) {
    if (cargarMaps.p) return cargarMaps.p;
    cargarMaps.p = new Promise(function (res, rej) {
      window.__markiMaps = function () { res(); };
      window.gm_authFailure = function () { cargarMaps.p = null; aviso('Google rechazó la clave. Revísala en Configuración.', 'err'); };
      var s = document.createElement('script');
      s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) + '&v=weekly&loading=async&language=es&region=BO&callback=__markiMaps';
      s.async = true; s.onerror = function () { cargarMaps.p = null; rej(new Error('Sin conexión con Google Maps')); };
      document.head.appendChild(s);
      setTimeout(function () { rej(new Error('Google Maps no respondió')); }, 15000);
    });
    return cargarMaps.p;
  }
  var CAMPOS_G = ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'userRatingCount', 'regularOpeningHours', 'nationalPhoneNumber', 'websiteURI', 'googleMapsURI', 'photos', 'primaryTypeDisplayName', 'businessStatus'];
  function consultarGoogle(texto) {
    return cargarMaps(cfg().googleKey).then(function () { return google.maps.importLibrary('places'); }).then(function (lib) {
      return lib.Place.searchByText({ textQuery: texto, fields: CAMPOS_G, locationBias: { center: COBIJA, radius: 25000 }, maxResultCount: 5, language: 'es', region: 'bo' });
    }).then(function (r) { return (r && r.places) || []; });
  }
  /* El horario más repetido de la semana, sin el nombre del día (por ejemplo, «11:00–22:00») */
  function horarioTexto(h) {
    var l = (h && h.weekdayDescriptions) || [], c = {}; l.forEach(function (t) { var x = String(t).replace(/^[^:]+:\s*/, '').trim(); if (x) c[x] = (c[x] || 0) + 1; });
    return Object.keys(c).sort(function (a, b) { return c[b] - c[a]; })[0] || '';
  }
  function resumenGoogle(p) {
    return { id: p.id, nombre: p.displayName || '', direccion: p.formattedAddress || '', rating: p.rating == null ? null : Math.round(p.rating * 10) / 10, n: p.userRatingCount || 0,
      horario: !!p.regularOpeningHours, horTxt: horarioTexto(p.regularOpeningHours), telefono: p.nationalPhoneNumber || '', web: p.websiteURI || '', maps: p.googleMapsURI || '', fotos: (p.photos || []).length,
      categoria: p.primaryTypeDisplayName || '', estado: p.businessStatus || '', fecha: new Date().toISOString() };
  }
  function aplicarGoogle(g) {
    E.google = g;
    var ficha = ['Tiene ficha']; if (g.categoria) ficha.push('Categoría'); if (g.horario) ficha.push('Horario'); if (g.telefono) ficha.push('Teléfono'); ficha.push('Ubicación exacta'); if (g.fotos) ficha.push('Fotos');
    E.datos.ficha = ficha; E.datos.resenas = g.n; if (g.n && g.rating != null) E.datos.calificacion = g.rating; else delete E.datos.calificacion;
    if (g.maps) E.links.maps = g.maps; if (g.web && !E.links.web) E.links.web = g.web;
    /* también sirve para comparar los datos entre canales (D2.2) y para saber si tiene sitio web (D7.2) */
    var en = E.datos.entrada = E.datos.entrada || { posts: [], nap: {}, ia1: '', ia2: '' }; en.nap = en.nap || {}; var gm = en.nap['Google Maps'] = en.nap['Google Maps'] || {};
    if (!gm.tel && g.telefono) gm.tel = g.telefono; if (!gm.dir && g.direccion) gm.dir = g.direccion.split(',')[0]; if (!gm.hor && g.horTxt) gm.hor = g.horTxt;
    if (g.web) { var o = E.datos['p_D7.2'] = E.datos['p_D7.2'] || {}; if (o.enlace == null) { o.enlace = true; E.datos.det = E.datos.det || {}; E.datos.det['p_D7.2.enlace'] = true; } }
    E.notas.D2 = (E.notas.D2 ? E.notas.D2 + ' ' : '') + 'Ficha de Google consultada el ' + fecha(g.fecha) + ': ' + (g.n ? g.n + ' reseñas, ' + f1(g.rating) + ' estrellas' : 'sin reseñas') + '.';
  }
  function buscarEnGoogle(q) {
    var box = $('#gres'); if (!q) { aviso('Escribe primero el nombre del negocio.'); return; }
    box.innerHTML = '<p class="nota">Buscando «' + esc(q) + '» en Google Maps…</p>';
    consultarGoogle(q + ' Cobija Pando').then(function (lista) {
      if (!lista.length) { box.innerHTML = '<p class="g-nada">Google Maps no encontró «' + esc(q) + '» en Cobija. Si de verdad no tiene ficha, en la rúbrica deja sin marcar «Tiene ficha».</p>'; return; }
      var R2 = lista.map(resumenGoogle);
      box.innerHTML = '<p class="nota" style="margin:10px 0 6px">Elige el negocio correcto:</p><div class="g-lista">' + R2.map(function (g, i) {
        return '<button class="g-op" data-i="' + i + '"><b>' + esc(g.nombre) + '</b><small>' + esc(g.direccion) + '</small><span>' + (g.n ? '★ ' + f1(g.rating) + ' · ' + pl(g.n, 'reseña', 'reseñas') : 'sin reseñas') + (g.estado && g.estado !== 'OPERATIONAL' ? ' · cerrado' : '') + '</span></button>'; }).join('') +
        '<button class="g-op ninguno" data-i="-1">Ninguno es el negocio</button></div>';
      $$('.g-op').forEach(function (bt) { bt.onclick = function () { var i = +bt.dataset.i; box.innerHTML = '';
        if (i < 0) { aviso('No se usaron datos de Google.'); return; }
        aplicarGoogle(R2[i]); $('#gsel').innerHTML = fichaGoogle(E.google); enlazarQuitar();
        $$('[data-link]').forEach(function (inp) { if (E.links[inp.dataset.link]) inp.value = E.links[inp.dataset.link]; });
        aviso('Listo: se cargaron los datos de la ficha de Google.', 'okk'); }; });
    }).catch(function (e) {
      var m = String(e && e.message || e);
      box.innerHTML = '<p class="g-nada">No se pudo consultar Google: ' + esc(m.slice(0, 180)) + '<br>Revisa la conexión y la clave en Configuración. Puedes seguir sin esta búsqueda.</p>';
    });
  }
  function enlazarQuitar() { var q = $('#gquitar'); if (q) q.onclick = function () { E.google = null; delete E.datos.ficha; delete E.datos.resenas; delete E.datos.calificacion; $('#gsel').innerHTML = ''; }; }

  /* ================================================================ paso 2: rúbrica */
  function urlDe(clave, q) {
    var L = E.links || {};
    if (clave === 'facebook') return L.facebook || 'https://www.facebook.com/search/top?q=' + encodeURIComponent(q);
    if (clave === 'instagram') return L.instagram || 'https://www.google.com/search?q=' + encodeURIComponent(q + ' site:instagram.com');
    if (clave === 'tiktok') return L.tiktok || 'https://www.tiktok.com/search?q=' + encodeURIComponent(q);
    if (clave === 'maps') return L.maps || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q + ' Cobija');
    if (clave === 'web') return L.web || 'https://www.google.com/search?q=' + encodeURIComponent(q + ' Cobija');
  }
  function ayudas(d) {
    var q = E.nombre, preg = '¿Qué sabes de ' + E.nombre + ' en Cobija, Bolivia?', preg2 = '¿Qué me recomiendas de ' + (E.rubro === 'Otro' ? (E.rubroDetalle || 'negocios').toLowerCase() : rubroDe(E.rubro)[2]) + ' en Cobija, Bolivia?';
    var L = { D1: ['facebook', 'instagram', 'tiktok', 'maps'], D2: ['maps', 'facebook'], D3: ['facebook', 'instagram', 'tiktok'], D4: ['facebook', 'instagram', 'tiktok'], D5: ['maps'], D6: ['facebook', 'instagram', 'tiktok'], D7: ['web'] }[d.id] || [];
    var nom = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', maps: 'Google Maps', web: 'Sitio web o Google' };
    var h = L.map(function (k) { return '<a href="' + esc(urlDe(k, q)) + '" target="_blank" rel="noopener">' + nom[k] + (E.links[k] ? ' ✓' : '') + ' ↗</a>'; }).join('');
    if (d.id === 'D2') h += '<a href="https://chatgpt.com/?q=' + encodeURIComponent(preg2) + '" target="_blank" rel="noopener">ChatGPT: recomendación ↗</a><a href="https://chatgpt.com/?q=' + encodeURIComponent(preg) + '" target="_blank" rel="noopener">ChatGPT: el negocio ↗</a>';
    if (d.id === 'D4' && E.links.whatsapp) h += '<a href="https://wa.me/' + esc(E.links.whatsapp.replace(/[^0-9]/g, '')) + '?text=' + encodeURIComponent('Buenas tardes, ¿cuál es su horario de atención esta semana?') + '" target="_blank" rel="noopener">Enviar mensaje de prueba ↗</a>';
    if (d.id === 'D6' && E.links.whatsapp) h += '<a href="https://wa.me/' + esc(E.links.whatsapp.replace(/[^0-9]/g, '')) + '" target="_blank" rel="noopener">WhatsApp ↗</a>';
    if (d.id === 'D7') h += '<a href="https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BO&q=' + encodeURIComponent(q) + '&search_type=keyword_unordered" target="_blank" rel="noopener">Biblioteca de anuncios de Meta ↗</a>';
    return '<div class="ayudas">' + h + '</div>';
  }
  function widgetAuto(it) {
    var a = it.auto; if (!a) return '';
    var v = E.datos[a.campo], h;
    if (a.tipo === 'preguntas') {
      var o = v || {};
      h = '<div class="auto preg" data-auto="' + it.id + '"><span class="auto-t">Responde lo que ves; Marki decide el nivel</span><div class="pqs">' + a.preguntas.map(function (q) {
        var ctl = q.tipo === 'sn' ? '<div class="sn" role="group"><button type="button" data-sn="1"' + (o[q.k] === true ? ' class="on"' : '') + '>Sí</button><button type="button" data-sn="0"' + (o[q.k] === false ? ' class="on"' : '') + '>No</button></div>'
          : '<input type="number" min="0" step="1" inputmode="numeric" class="num" data-nk value="' + (o[q.k] == null ? '' : o[q.k]) + '">';
        return '<div class="pq" data-k="' + q.k + '"><span class="pq-t">' + esc(textoPregunta(q.t)) + (q.ej ? '<small class="ej">' + esc(q.ej) + '</small>' : '') + '</span>' + ctl + '</div>'; }).join('') +
        '</div><details class="pie-regla"><summary>¿Cómo decide Marki?</summary><small class="regla">' + esc(a.regla) + '</small></details><span class="auto-r"></span></div>';
      return h;
    }
    var Q = DATO_Q[it.id] || [a.etiqueta, ''], ej = Q[1] ? '<small class="ej">' + esc(Q[1]) + '</small>' : '';
    h = '<div class="auto dato" data-auto="' + it.id + '"><div class="pq pq-dato"><span class="pq-t">' + esc(Q[0]) + ej + '</span>';
    if (a.tipo === 'checks') h += '</div><div class="chips-chk">' + a.opciones.map(function (o) { var on = v && v.indexOf(o) >= 0;
      return '<label class="chk"><input type="checkbox" data-op="' + esc(o) + '"' + (on ? ' checked' : '') + '><span>' + esc(ETIQ_OP[o] || o) + '</span></label>'; }).join('') + '</div>';
    else if (a.tipo === 'tiempo') h += '<input type="number" min="0" step="1" data-st="5" class="num" data-num value="' + (typeof v === 'number' ? v : '') + '"></div>' +
      '<label class="chk chk-sin"><input type="checkbox" data-sin' + (v === 'sin' ? ' checked' : '') + '><span>No respondió en 24 horas o no tiene dónde escribirle</span></label>';
    else h += '<input type="number" min="0" step="' + (a.paso || 1) + '"' + (it.id === 'D5.2' ? ' max="5" data-inicio="4"' : '') + ' class="num" data-num value="' + (v == null ? '' : v) + '"></div>';
    return h + '<span class="auto-r"></span></div>';
  }
  /* Preguntas de los indicadores que se responden con un dato (no con Sí/No) */
  var DATO_Q = {
    'D2.1': ['¿Qué tiene su ficha de Google Maps?', 'Busca el nombre del negocio en Google Maps y marca todo lo que veas. Si no aparece, no marques nada.'],
    'D3.1': ['¿Cuántas veces publicó en los últimos 30 días?', 'Cuenta las publicaciones de su red principal, sin contar las historias.'],
    'D3.2': ['¿Qué formatos usó en el último mes?', 'Marca todos los que veas en sus publicaciones y en las historias destacadas del perfil.'],
    'D4.3': ['¿Cuántos minutos tardó en responder tu mensaje?', 'Envía una consulta breve, como el horario o un precio, y anota el tiempo. Una hora son 60 minutos.'],
    'D5.1': ['¿Cuántas reseñas tiene en Google Maps?', 'Es el número que aparece al lado de las estrellas.'],
    'D5.2': ['¿Qué calificación tiene en Google Maps?', 'Es el número de estrellas, de 1 a 5; por ejemplo, 4,3. Si no tiene reseñas, Marki no la califica y no le resta puntos.']
  };
  var ETIQ_OP = { 'Tiene ficha': 'Aparece en Google Maps', 'Categoría': 'Tipo de negocio (categoría)', 'Ubicación exacta': 'Ubicación exacta en el mapa',
    'Foto o afiche': 'Fotos o afiches', 'Video corto': 'Videos cortos', 'Carrusel': 'Carruseles', 'Transmisión en vivo': 'Transmisiones en vivo' };
  function vRubrica() {
    if (!E.inicio && !E.editando) E.inicio = new Date().toISOString();
    var h = cab('nueva') + '<main><ol class="pasos"><li class="hecho"><b>✓</b>Datos de la marca</li><li class="act"><b>2</b>Rúbrica</li><li><b>3</b>Diagnóstico</li></ol><div class="eval"><div>' +
      '<div class="tarjeta cab-eval"><div><span class="eyebrow">' + esc(E.origen) + (E.evaluador ? ' · evaluador ' + esc(E.evaluador) : '') + '</span><h2>' + esc(E.nombre) + '</h2><p class="sub" style="margin:0">' + esc(rubroTexto(E)) + ' · red principal: ' + esc(E.red) + (E.seguidores != null ? ' · ' + E.seguidores.toLocaleString('es-BO') + ' seguidores' : '') + '</p><label class="rev9">Publicaciones que vas a revisar en ' + esc(E.red || 'la red principal') + ': <input type="number" min="1" max="9" id="rev9" value="' + (E.datos.rev9 || 9) + '"><small>Las últimas 9; si tiene menos, escribe cuántas tiene.</small></label><button class="btn sec chico" id="vdatos" style="margin-top:12px">← Corregir los datos de la marca</button>' + (E.google ? '<p class="nota">Ficha de Google cargada: ' + esc(E.google.nombre) + (E.google.n ? ' · ★ ' + f1(E.google.rating) + ' · ' + E.google.n + ' reseñas' : '') + '</p>' : '') + '</div>' +
      '<div class="atajos"><b>Teclado</b><span><kbd>0</kbd><kbd>1</kbd><kbd>2</kbd> ajustar a mano</span><span><kbd>N</kbd> no se pudo evaluar</span><span><kbd>↑</kbd><kbd>↓</kbd> moverse</span></div></div>';
    var pq1 = '¿Qué me recomiendas de ' + (E.rubro === 'Otro' ? (E.rubroDetalle || 'negocios').toLowerCase() : rubroDe(E.rubro)[2]) + ' en Cobija, Bolivia?', pq2 = '¿Qué sabes de ' + E.nombre + ' en Cobija, Bolivia?';
    h += '<nav class="pestanas" id="pest" aria-label="Partes de la evaluación"><button data-tab="entrada" title="Atajo opcional: pega y Marki cuenta por ti">' + icono('entrada', 20) + '<span>Atajo</span><i></i></button>' +
      DIMS.map(function (d) { return '<button data-tab="' + d.id + '">' + icono(d.id, 20) + '<span>' + esc(d.corto) + '</span><i></i></button>'; }).join('') + '</nav>';
    h += '<section class="tarjeta entrada" id="entrada"><div class="ent-cab"><div><span class="opcional">Opcional</span><h2>Atajo: pega y Marki cuenta por ti</h2><p class="sub" style="margin:0">No es obligatorio. Si lo saltas, respondes tú las preguntas en cada dimensión (por ejemplo, «¿cuántas publicaciones muestran el precio?») y Marki aplica la misma regla. Si pegas los textos, Marki cuenta por ti y el diagnóstico puede citar ejemplos reales del negocio.</p></div></div>' +
      '<details class="ent"><summary><b>Textos de las publicaciones</b><small>Cuenta por ti: contenido de valor, precios, llamado a la acción y promociones</small></summary><p class="nota">Copia el texto de cada una de las últimas publicaciones de ' + esc(E.red || 'la red principal') + ', una por casilla. Marki detecta precios, llamados a la acción, promociones y contenido que aporta valor.</p><div class="posts" id="entPosts"></div><p class="ent-res" id="entPubRes"></p></details>' +
      '<details class="ent"><summary><b>Teléfono, dirección y horario en cada canal</b><small>Compara por ti si los datos coinciden</small></summary><p class="nota">Escribe lo que muestra cada canal. Deja vacío lo que no aparezca. Marki compara y encuentra contradicciones.</p>' +
      '<div class="nap"><span></span><b>Teléfono</b><b>Dirección</b><b>Horario</b>' + ['Google Maps', 'Facebook', 'Instagram', 'WhatsApp u otro'].map(function (c) { return '<span>' + c + '</span><input data-nap="' + c + '|tel" inputmode="tel" placeholder="—"><input data-nap="' + c + '|dir" placeholder="—"><input data-nap="' + c + '|hor" placeholder="—">'; }).join('') + '</div><p class="ent-res" id="entNapRes"></p></details>' +
      '<details class="ent"><summary><b>Respuestas de ChatGPT</b><small>Revisa por ti si la IA conoce al negocio</small></summary><p class="nota">Usa ChatGPT gratis, sin iniciar sesión y en una conversación nueva. Copia cada respuesta completa.</p>' +
      '<div class="ia"><label><span>Pregunta 1: «' + esc(pq1) + '» <a href="https://chatgpt.com/?q=' + encodeURIComponent(pq1) + '" target="_blank" rel="noopener">Abrir ↗</a></span><textarea id="ia1" rows="3" placeholder="Pega aquí la respuesta"></textarea></label>' +
      '<label><span>Pregunta 2: «' + esc(pq2) + '» <a href="https://chatgpt.com/?q=' + encodeURIComponent(pq2) + '" target="_blank" rel="noopener">Abrir ↗</a></span><textarea id="ia2" rows="3" placeholder="Pega aquí la respuesta"></textarea></label></div><p class="ent-res" id="entIaRes"></p></details><div class="sig-parte"><button class="btn sec" data-sig="D1">Saltar este atajo</button><span class="espacio"></span><button class="btn pri" data-sig="D1">Siguiente: ' + esc(DIMS[0].nombre) + '</button></div></section>';
    DIMS.forEach(function (d, k) {
      h += '<section class="tarjeta dim" id="' + d.id + '"><div class="dim-cab"><span class="num">' + icono(d.id, 24) + '</span><div><span class="dim-n">Dimensión ' + (k + 1) + ' de 7</span><h2>' + esc(d.nombre) + '</h2><p class="sub" style="margin:0">' + esc(d.pregunta) + '</p></div><span class="pct" data-pct="' + d.id + '">–</span></div>' + ayudas(d);
      d.items.forEach(function (it) {
        h += '<div class="item" data-item="' + it.id + '"><div class="item-cab"><b>' + esc(it.nombre) + '</b><code>' + it.id + '</code><span class="calc" hidden>Nivel decidido por Marki</span><span class="mano" hidden>Ajustado a mano</span></div>' +
          (it.que ? '<p class="que-mide">' + esc(it.que) + '</p>' : '') + '<div class="donde"><b>Dónde mirar:</b> ' + esc(it.donde) + '</div>' + widgetAuto(it) +
          '<div class="medidor" data-med="' + it.id + '" aria-live="polite"><span class="m-barra"><i></i><i></i><i></i></span><b class="m-txt">Responde y Marki decide el nivel</b></div>' +
          '<div class="ops" data-it="' + it.id + '">' + it.n.map(function (t, v) { return '<button class="op" data-v="' + v + '"><i>' + v + '</i><span>' + esc(t) + '</span></button>'; }).join('') +
          '<button class="op na" data-v="na">No se pudo evaluar</button></div></div>';
      });
      h += '<label class="campo" style="margin-top:14px"><small>Evidencia u observación (opcional)</small><textarea data-nota="' + d.id + '" placeholder="Qué viste, dónde y cuándo; por ejemplo: «último post del 2 de noviembre»">' + esc(E.notas[d.id] || '') + '</textarea></label>' +
        '<div class="sig-parte">' + (k > 0 ? '<button class="btn sec" data-sig="' + DIMS[k - 1].id + '">Anterior</button>' : '<button class="btn sec" data-sig="entrada">Volver al atajo</button>') + '<span class="espacio"></span>' +
        (k < DIMS.length - 1 ? '<button class="btn pri" data-sig="' + DIMS[k + 1].id + '">Siguiente: ' + esc(DIMS[k + 1].nombre) + '</button>' : '<button class="btn pri" data-fin2>Ver diagnóstico</button>') + '</div></section>';
    });
    h += '</div><aside class="lateral" tabindex="0" aria-label="Avance de la evaluación"><div class="tarjeta"><div class="vivo"><div id="anv"></div><div class="mini-nivel" id="niv"></div></div><div id="rad" style="margin-top:6px"></div><div class="leyenda" id="leg"></div></div>' +
      '<div class="tarjeta"><ul class="progreso" id="prog"></ul><button class="btn pri" id="fin" style="width:100%;margin-top:14px" disabled>Ver diagnóstico</button><p class="nota" id="falta"></p></div></aside></div></main>';
    app.innerHTML = h; enlazar();
    var ref = referencia(unaPorNegocio(estudio(leer(), E.id))), actual = 0;
    $('#leg').innerHTML = '<span><i></i>Esta marca</span>' + (ref ? '<span><i class="c"></i>Promedio de Cobija (n = ' + ref.n + ')</span>' : '');
    function marcar(id, v, auto) {
      var g = $('[data-it="' + id + '"]'); g.querySelectorAll('.op').forEach(function (x) { x.classList.toggle('on', x.dataset.v === (v === null ? 'na' : String(v))); });
      if (v === undefined) { delete E.resp[id]; g.querySelectorAll('.op').forEach(function (x) { x.classList.remove('on'); }); } else E.resp[id] = v;
      E.auto[id] = !!auto; $('[data-item="' + id + '"] .calc').hidden = !auto;
      var itx = ITEM[id], conDatos = itx.auto && autoNivel(itx, E.datos) !== undefined; $('[data-item="' + id + '"] .mano').hidden = !!auto || v === undefined || !conDatos;
      pintarMedidor(id, v, auto); actualizar();
    }
    var MED_TXT = ['Nivel 0 · Por mejorar', 'Nivel 1 · En camino', 'Nivel 2 · ¡Muy bien!'];
    function pintarMedidor(id, v, auto) {
      var m = $('[data-med="' + id + '"]'), card = $('[data-item="' + id + '"]'); if (!m) return;
      var cls = v === undefined ? '' : v === null ? 'na' : 'n' + v, antes = m.dataset.v;
      m.className = 'medidor ' + cls; m.querySelector('.m-txt').textContent = v === undefined ? 'Responde y Marki decide el nivel' : v === null ? 'No se puede evaluar · no resta puntos' : MED_TXT[v];
      card.classList.toggle('hecho', v !== undefined);
      if (antes !== cls && cls) { m.classList.remove('pulso'); void m.offsetWidth; m.classList.add('pulso'); }
      /* al decidirse por primera vez, se resalta el siguiente indicador pendiente de la misma parte */
      if (!antes && cls && auto && pintarMedidor.listo) { var dimId = id.split('.')[0], sig = ITEMS.filter(function (x) { return x.id.indexOf(dimId + '.') === 0 && E.resp[x.id] === undefined && x.id !== id; })[0];
        if (sig) { $$('.item').forEach(function (x) { x.classList.remove('foco'); }); var el2 = $('[data-item="' + sig.id + '"]'); if (el2) { el2.classList.add('foco'); actual = ITEMS.indexOf(sig); } } }
      m.dataset.v = cls;
    }
    function mostrar(tab, sinSubir) {
      mostrar.act = tab; $$('.eval .dim, .eval .entrada').forEach(function (s) { s.classList.toggle('vis', s.id === tab); });
      $$('#pest [data-tab]').forEach(function (b) { b.classList.toggle('act', b.dataset.tab === tab); b.setAttribute('aria-current', b.dataset.tab === tab ? 'step' : 'false'); });
      var pb = $('#pest'), ba = $('#pest .act'); if (pb && ba && pb.scrollWidth > pb.clientWidth) pb.scrollTo({ left: ba.offsetLeft - (pb.clientWidth - ba.offsetWidth) / 2, behavior: 'smooth' });
      if (!sinSubir) { var pe = $('#pest'), sec = document.getElementById(tab), bajo = (parseFloat(getComputedStyle(pe).top) || 0) + pe.offsetHeight + 10;
        var y = sec.getBoundingClientRect().top + window.scrollY - bajo; if (Math.abs(y - window.scrollY) > 4) window.scrollTo({ top: Math.max(0, y), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
      if (tab !== 'entrada') { var it0 = ITEMS.filter(function (it) { return it.id.indexOf(tab + '.') === 0 && E.resp[it.id] === undefined; })[0] || ITEMS.filter(function (it) { return it.id.indexOf(tab + '.') === 0; })[0];
        actual = ITEMS.indexOf(it0); $$('.item').forEach(function (x) { x.classList.remove('foco'); }); var el = $('[data-item="' + it0.id + '"]'); if (el) el.classList.add('foco'); }
    }
    function enfocar(i) { actual = Math.max(0, Math.min(ITEMS.length - 1, i)); var dimI = ITEMS[actual].id.split('.')[0]; if (mostrar.act !== dimI) mostrar(dimI, true); $$('.item').forEach(function (x) { x.classList.remove('foco'); });
      var el = $('[data-item="' + ITEMS[actual].id + '"]'); el.classList.add('foco'); var r = el.getBoundingClientRect(); if (r.top < 90 || r.bottom > innerHeight - 20) el.scrollIntoView({ block: 'center' }); }
    function siguiente() { for (var i = actual + 1; i < ITEMS.length; i++) if (E.resp[ITEMS[i].id] === undefined) return enfocar(i); enfocar(actual + 1); }
    $$('.ops').forEach(function (g) { g.onclick = function (ev) { var b = ev.target.closest('.op'); if (!b) return;
      actual = ITEMS.indexOf(ITEM[g.dataset.it]); marcar(g.dataset.it, b.dataset.v === 'na' ? null : +b.dataset.v, false); siguiente(); }; });
    $$('.item').forEach(function (el) { el.addEventListener('mousedown', function () { actual = ITEMS.indexOf(ITEM[el.dataset.item]); $$('.item').forEach(function (x) { x.classList.remove('foco'); }); el.classList.add('foco'); }); });
    function recalcular(it) {
      var a = it.auto, box = $('[data-auto="' + it.id + '"]'); if (!box) return;
      if (a.tipo === 'checks') {
        var cks = $$('[data-auto="' + it.id + '"] [data-op]');
        if (a.campo === 'ficha' && recalcular.origen) {
          var primero = cks[0], otro = recalcular.origen !== primero;
          if (otro && recalcular.origen.checked) primero.checked = true;            /* marcar un dato implica que la ficha existe */
          if (!otro && !primero.checked) cks.forEach(function (c) { c.checked = false; }); /* sin ficha no hay datos de la ficha */
        }
        E.datos[a.campo] = cks.filter(function (c) { return c.checked; }).map(function (c) { return c.dataset.op; });
      }
      else if (a.tipo === 'tiempo') { var s = box.querySelector('[data-sin]').checked, n = box.querySelector('[data-num]'); n.disabled = s; E.datos[a.campo] = s ? 'sin' : (n.value === '' ? null : +n.value); }
      else { var nv = box.querySelector('[data-num]').value; E.datos[a.campo] = nv === '' ? null : +String(nv).replace(',', '.'); }
      aplicarAuto(a.campo);
      if (a.campo === 'resenas' && ITEM['D5.3'] && ITEM['D5.3'].auto && ITEM['D5.3'].auto.tipo === 'preguntas') visibles(ITEM['D5.3']);
      if (a.campo === 'resenas') { var c52 = $('[data-auto="D5.2"] [data-num]'); if (c52) { c52.disabled = E.datos.resenas === 0; if (c52.disabled) { c52.value = ''; E.datos.calificacion = null; } } }
    }
    function aplicarAuto(campo) {
      ITEMS.forEach(function (it) {
        var a = it.auto, cero = (a && a.na_si_cero) || it.na_si_cero;
        if (!((a && a.campo === campo) || cero === campo || (campo === 'resenas' && a && a.tipo === 'preguntas' && it.id === 'D5.3'))) return;
        var v = a ? autoNivel(it, E.datos) : (cero && E.datos[cero] === 0 ? null : undefined);
        var box = $('[data-auto="' + it.id + '"] .auto-r');
        if (v !== undefined) { marcar(it.id, v, true); if (box) box.innerHTML = v === null ? '→ No se puede evaluar' + (cero && E.datos[cero] === 0 ? ' (sin reseñas)' : '') : '→ Nivel <b>' + v + '</b>'; }
        else { if (E.auto[it.id]) marcar(it.id, undefined, false); if (box) box.textContent = ''; }
      });
    }
    function visibles(it) {
      var a = it.auto, o = E.datos[a.campo] || {}, box = $('[data-auto="' + it.id + '"]');
      a.preguntas.forEach(function (q) { var el = box.querySelector('[data-k="' + q.k + '"]');
        var ver = (!q.si || o[q.si] === true) && (!q.no || o[q.no] === false) && (!q.siMayor || o[q.siMayor] > 0) && !(it.id === 'D5.3' && E.datos.resenas === 0); el.hidden = !ver; /* sin reseñas no hay nada que preguntar */
        var inp = el.querySelector('[data-nk]'); if (inp) { var mx = q.maxRev ? (E.datos.rev9 || 9) : q.maxDe ? o[q.maxDe] : q.maxResenas ? Math.min(10, E.datos.resenas || 10) : q.max; if (mx != null) inp.max = mx; } });
    }
    function aplicarPreguntas(it) { visibles(it); aplicarAuto(it.auto.campo); }
    ITEMS.forEach(function (it) { if (!it.auto || it.auto.tipo !== 'preguntas') return; var a = it.auto, box = $('[data-auto="' + it.id + '"]');
      box.querySelectorAll('.pq').forEach(function (el) { var q = a.preguntas.filter(function (x) { return x.k === el.dataset.k; })[0];
        el.querySelectorAll('[data-sn]').forEach(function (b) { b.onclick = function () { var o = E.datos[a.campo] = E.datos[a.campo] || {};
          o[q.k] = b.dataset.sn === '1'; el.querySelectorAll('[data-sn]').forEach(function (x) { x.classList.toggle('on', x === b); }); aplicarPreguntas(it); }; });
        var inp = el.querySelector('[data-nk]'); if (inp) inp.oninput = function () { var o = E.datos[a.campo] = E.datos[a.campo] || {};
          var n = inp.value === '' ? null : Math.max(0, Math.round(+inp.value)); if (n != null && inp.max !== '' && n > +inp.max) { n = +inp.max; inp.value = n; }
          o[q.k] = n; aplicarPreguntas(it); };
      });
      visibles(it);
    });
    /* ================= datos de entrada: el evaluador pega o escribe; Marki lee y responde las preguntas */
    var AZR = window.MARKI_ANALIZADOR, ENT = E.datos.entrada = E.datos.entrada || { posts: [], nap: {}, ia1: '', ia2: '' };
    E.datos.det = E.datos.det || {};
    var CANALES = ['Google Maps', 'Facebook', 'Instagram', 'WhatsApp u otro'];
    function pintarPq(it) {
      var a = it.auto, o = E.datos[a.campo] || {}, box = $('[data-auto="' + it.id + '"]'); if (!box) return;
      a.preguntas.forEach(function (q) { var el = box.querySelector('[data-k="' + q.k + '"]');
        el.querySelectorAll('[data-sn]').forEach(function (b) { b.classList.toggle('on', o[q.k] === (b.dataset.sn === '1')); });
        var inp = el.querySelector('[data-nk]'); if (inp) inp.value = o[q.k] == null ? '' : o[q.k];
        el.classList.toggle('leido', !!E.datos.det[a.campo + '.' + q.k]); });
      aplicarPreguntas(it);
    }
    function poner(id, k, v) { var it = ITEM[id], c = it.auto.campo, o = E.datos[c] = E.datos[c] || {};
      if (v === undefined) { if (E.datos.det[c + '.' + k]) { delete o[k]; delete E.datos.det[c + '.' + k]; } return; }
      o[k] = v; E.datos.det[c + '.' + k] = true; }
    function etiquetasPost(i) { var a = AZR.analizarPost(ENT.posts[i] || ''), el = $('[data-tags="' + i + '"]'); if (!el) return;
      el.innerHTML = (ENT.posts[i] || '').trim() ? Object.keys(AZR.PATRONES).filter(function (k) { return a[k]; }).map(function (k) { return '<span class="tag t-' + k + '" title="Detectado por: «' + esc(a[k]) + '»">' + AZR.PATRONES[k].nombre + '</span>'; }).join('') + (a.precioInterno ? '<span class="tag t-no">Precio por interno</span>' : '') || '<span class="tag t-nada">Sin señales</span>' : ''; }
    function leerPublicaciones() {
      var rev = E.datos.rev9 || 9, llenos = ENT.posts.slice(0, rev).filter(function (t) { return (t || '').trim().length > 2; }).length, r = AZR.analizarPublicaciones(ENT.posts.slice(0, rev));
      var res = $('#entPubRes');
      if (llenos < rev) { res.innerHTML = llenos ? 'Pegaste ' + llenos + ' de ' + rev + '. Marki responderá cuando estén las ' + rev + ' publicaciones.' : ''; return; }
      poner('D6.2', 'n', r.accion); poner('D3.3', 'n', r.valor); poner('D6.1', 'n', r.precio); poner('D7.3', 'hay', r.promo > 0); poner('D7.3', 'mide', r.promo > 0 ? r.medible > 0 : undefined);
      ['D6.2', 'D3.3', 'D6.1', 'D7.3'].forEach(function (id) { pintarPq(ITEM[id]); });
      res.innerHTML = '<b>Marki leyó ' + pl(rev, 'publicación', 'publicaciones') + ':</b> ' + r.precio + ' con precio · ' + r.accion + ' dicen cómo comprar · ' + r.valor + ' aportan valor · ' + r.promo + ' con promoción (' + r.medible + ' medible). Respondió D3.3, D6.1, D6.2 y D7.3.';
    }
    function leerCanales() {
      var c = AZR.compararCanales(ENT.nap), res = $('#entNapRes');
      if (c.canales < 2) { res.innerHTML = c.canales ? 'Escribe los datos de al menos dos canales para compararlos.' : ''; poner('D2.2', 'contra', undefined); poner('D2.2', 'falta', undefined); pintarPq(ITEM['D2.2']); return; }
      poner('D2.2', 'contra', c.conflictos.length > 0); poner('D2.2', 'falta', c.conflictos.length ? undefined : c.faltan.length > 0); pintarPq(ITEM['D2.2']);
      res.innerHTML = c.conflictos.length ? '<b class="mal">Datos que se contradicen:</b> ' + esc(c.conflictos.join('; ')) : c.faltan.length ? '<b class="medio">Sin contradicciones, pero falta:</b> ' + esc(c.faltan.join('; ')) : '<b class="bien">Los datos coinciden en los ' + c.canales + ' canales.</b>';
    }
    function leerIA() {
      var r = AZR.analizarIA(E.nombre, ENT.ia1, ENT.ia2), res = $('#entIaRes'), t = [];
      poner('D2.3', 'recomienda', r.recomienda); poner('D2.3', 'reconoce', r.recomienda ? undefined : r.reconoce); pintarPq(ITEM['D2.3']);
      if (r.recomienda !== undefined) t.push(r.recomienda ? '<b class="bien">Pregunta 1: lo menciona</b> (' + esc(r.por1) + ')' : '<b class="mal">Pregunta 1: no lo menciona</b>');
      if (r.reconoce !== undefined && !r.recomienda) t.push(r.reconoce ? '<b class="bien">Pregunta 2: lo reconoce</b>. Revisa si los datos son correctos.' : '<b class="mal">Pregunta 2: no lo reconoce</b>' + (r.dudas ? ' (dice que no tiene información)' : ''));
      res.innerHTML = t.join(' · ');
    }
    function htmlPosts() { var rev = E.datos.rev9 || 9, h = '';
      for (var i = 0; i < rev; i++) h += '<div class="post"><label><span>Publicación ' + (i + 1) + '</span><textarea data-post="' + i + '" rows="2" placeholder="Pega aquí el texto de la publicación ' + (i + 1) + '">' + esc(ENT.posts[i] || '') + '</textarea></label><div class="tags" data-tags="' + i + '"></div></div>';
      return h; }
    function enlazarPosts() { $$('[data-post]').forEach(function (t) { var i = +t.dataset.post; etiquetasPost(i); t.oninput = function () { ENT.posts[i] = t.value; etiquetasPost(i); clearTimeout(t._t); t._t = setTimeout(function () { leerPublicaciones(); guardarBorrador(E); }, 250); }; }); }
    $('#entPosts').innerHTML = htmlPosts(); enlazarPosts();
    $$('[data-nap]').forEach(function (inp) { var p = inp.dataset.nap.split('|'); inp.value = (ENT.nap[p[0]] || {})[p[1]] || '';
      inp.oninput = function () { (ENT.nap[p[0]] = ENT.nap[p[0]] || {})[p[1]] = inp.value; clearTimeout(inp._t); inp._t = setTimeout(leerCanales, 250); }; });
    $('#ia1').value = ENT.ia1 || ''; $('#ia2').value = ENT.ia2 || '';
    $('#ia1').oninput = function () { ENT.ia1 = this.value; clearTimeout(this._t); this._t = setTimeout(leerIA, 250); };
    $('#ia2').oninput = function () { ENT.ia2 = this.value; clearTimeout(this._t); this._t = setTimeout(leerIA, 250); };
    /* si el evaluador cambia una respuesta leída, deja de estar marcada como «leída» */
    $$('.auto.preg').forEach(function (box) { box.addEventListener('click', function (e) { var b = e.target.closest('[data-sn]'); if (!b) return; var pq = b.closest('.pq'), id = box.dataset.auto;
      delete E.datos.det[ITEM[id].auto.campo + '.' + pq.dataset.k]; pq.classList.remove('leido'); }, true);
      box.addEventListener('input', function (e) { var pq = e.target.closest('.pq'); if (!pq) return; delete E.datos.det[ITEM[box.dataset.auto].auto.campo + '.' + pq.dataset.k]; pq.classList.remove('leido'); }, true); });
    ITEMS.forEach(function (it) { if (it.auto && it.auto.tipo === 'preguntas') pintarPq(it); });
    if (ENT.posts.some(function (t) { return t; })) leerPublicaciones(); if (Object.keys(ENT.nap).length) leerCanales(); if (ENT.ia1 || ENT.ia2) leerIA();
    var r9 = $('#rev9'); r9.oninput = function () { var n = Math.round(+r9.value); if (!n || n < 1) return; if (n > 9) { n = 9; r9.value = 9; } E.datos.rev9 = n;
      ITEMS.forEach(function (it) { if (it.auto && it.auto.tipo === 'preguntas') aplicarPreguntas(it); });
      $('#entPosts').innerHTML = htmlPosts(); enlazarPosts(); leerPublicaciones(); };
    ITEMS.forEach(function (it) { if (!it.auto || it.auto.tipo === 'preguntas') return; var box = $('[data-auto="' + it.id + '"]'); box.querySelectorAll('input').forEach(function (i) { i.oninput = function () { recalcular.origen = i; recalcular(it); recalcular.origen = null; }; i.onchange = i.oninput; }); });
    /* al retomar, corregir o usar datos de Google: pintar lo que ya existe */
    ITEMS.forEach(function (it) { if (E.resp[it.id] !== undefined) marcar(it.id, E.resp[it.id], E.auto[it.id]); });
    ITEMS.forEach(function (it) { if (it.auto && E.datos[it.auto.campo] != null && E.auto[it.id] !== false) aplicarAuto(it.auto.campo);
      else if (it.auto && E.datos[it.auto.campo] != null && E.resp[it.id] !== undefined) marcar(it.id, E.resp[it.id], false); });
    $('#vdatos').onclick = function () { if (!E.editando) guardarBorrador(E); vDatos(E); };
    $$('[data-nota]').forEach(function (t) { t.oninput = function () { E.notas[t.dataset.nota] = t.value; guardarBorrador(E); }; });
    document.onkeydown = function (ev) {
      if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      var k = ev.key.toLowerCase(), id = ITEMS[actual].id;
      if (k === '0' || k === '1' || k === '2') { marcar(id, +k, false); siguiente(); ev.preventDefault(); }
      else if (k === 'n') { marcar(id, null, false); siguiente(); ev.preventDefault(); }
      else if (k === 'arrowdown' || k === 'j') { enfocar(actual + 1); ev.preventDefault(); }
      else if (k === 'arrowup' || k === 'k') { enfocar(actual - 1); ev.preventDefault(); }
    };
    function pintarPuntos(inp) {
      var w = inp.closest('.stepper'); if (!w) return; var pts = w.querySelector('.puntos'), mx = +inp.max, v = inp.value === '' ? -1 : +inp.value;
      if (!pts) return; if (!(mx > 0 && mx <= 12)) { pts.innerHTML = ''; return; }
      var h = ''; for (var k = 0; k < mx; k++) h += '<i class="' + (k < v ? 'on' : '') + '"></i>'; pts.innerHTML = h + '<small>' + (v < 0 ? '' : v + ' de ' + mx) + '</small>';
    }
    function mejorarNumeros() {
      $$('.item input.num').forEach(function (inp) { if (inp.closest('.stepper')) return;
        var w = document.createElement('div'); w.className = 'stepper'; inp.parentNode.insertBefore(w, inp);
        var menos = document.createElement('button'), mas = document.createElement('button'); menos.type = mas.type = 'button'; menos.textContent = '−'; mas.textContent = '+';
        menos.setAttribute('aria-label', 'Restar uno'); mas.setAttribute('aria-label', 'Sumar uno');
        w.appendChild(menos); w.appendChild(inp); w.appendChild(mas); if (inp.hasAttribute('data-nk')) { var pt = document.createElement('div'); pt.className = 'puntos'; w.appendChild(pt); }
        var paso = function (d) { if (inp.disabled) return; var st = +(inp.dataset.st || inp.step || 1), v = inp.value === '' ? (inp.dataset.inicio ? +inp.dataset.inicio : 0) : +String(inp.value).replace(',', '.') + d * st;
          v = Math.max(0, Math.round(v * 10) / 10); if (inp.max !== '' && v > +inp.max) v = +inp.max; inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); pintarPuntos(inp); };
        menos.onclick = function () { paso(-1); }; mas.onclick = function () { paso(1); };
        inp.addEventListener('input', function () { pintarPuntos(inp); }); pintarPuntos(inp);
      });
    }
    var listasPrev = null;
    function actualizar() {
      var p = puntajes(E.resp), nv = nivelDe(p.indice);
      var listas = DIMS.filter(function (d) { return d.items.every(function (it) { return E.resp[it.id] !== undefined; }); }).map(function (d) { return d.id; });
      if (listasPrev) listas.forEach(function (id) { if (listasPrev.indexOf(id) < 0) { var d = dimDe(id); aviso('✓ ' + d.nombre + ' lista: ' + (p.dims[id] == null ? 'no evaluable' : f0(p.dims[id]) + ' de 100'), 'okk');
        var t = $('#pest [data-tab="' + id + '"]'); if (t) { t.classList.remove('celebra'); void t.offsetWidth; t.classList.add('celebra'); } } });
      listasPrev = listas;
      $$('.item input.num[data-nk]').forEach(pintarPuntos);
      $('#anv').innerHTML = anillo(p.indice, 'índice'); $('#niv').innerHTML = nv ? (p.evaluados < ITEMS.length ? 'Nivel provisional' : 'Nivel') + '<b>' + nv.n.nombre + '</b>' + p.evaluados + ' de ' + ITEMS.length + ' indicadores' : 'Responde los datos para ver el resultado';
      $('#rad').innerHTML = radarSVG(p.dims, ref && ref.dims, { w: 330, h: 270, margen: 62 });
      $('#prog').innerHTML = DIMS.map(function (d) { var hechos = d.items.filter(function (it) { return E.resp[it.id] !== undefined; }).length, lista = hechos === d.items.length;
        return '<li><a data-ancla="' + d.id + '" class="' + (lista ? 'lista' : '') + '"><i>' + (lista ? '✓' : '') + '</i>' + esc(d.corto) + '<span>' + (p.dims[d.id] == null ? hechos + '/' + d.items.length : f0(p.dims[d.id])) + '</span></a></li>'; }).join('');
      DIMS.forEach(function (d) { $('[data-pct="' + d.id + '"]').textContent = p.dims[d.id] == null ? '–' : f0(p.dims[d.id]) + ' / 100'; });
      $$('[data-ancla]').forEach(function (a) { a.onclick = function () { mostrar(a.dataset.ancla); }; });
      DIMS.forEach(function (d) { var hechos = d.items.filter(function (it) { return E.resp[it.id] !== undefined; }).length, b = $('#pest [data-tab="' + d.id + '"] i');
        if (b) { b.textContent = hechos === d.items.length ? '✓' : hechos + '/' + d.items.length; b.parentNode.classList.toggle('lista', hechos === d.items.length); } });
      var ent = E.datos.entrada || {}, nEnt = [(ent.posts || []).some(function (t) { return t; }), Object.keys(ent.nap || {}).length > 0, !!(ent.ia1 || ent.ia2)].filter(Boolean).length, bE = $('#pest [data-tab="entrada"] i');
      if (bE) { bE.textContent = nEnt + '/3'; bE.parentNode.classList.toggle('lista', nEnt === 3); }
      if (!E.editando) guardarBorrador(E);
      var faltan = ITEMS.length - p.completos; $('#fin').disabled = faltan > 0 || p.evaluados < 14;
      $('#falta').textContent = faltan > 0 ? (faltan === 1 ? 'Falta 1 indicador.' : 'Faltan ' + faltan + ' indicadores.') : p.evaluados < 14 ? 'Se necesitan al menos 14 indicadores evaluados para emitir un diagnóstico.' : 'Todo listo.';
    }
    $$('#pest [data-tab]').forEach(function (b) { b.onclick = function () { mostrar(b.dataset.tab); }; });
    $$('[data-sig]').forEach(function (b) { b.onclick = function () { mostrar(b.dataset.sig); }; });
    $$('[data-fin2]').forEach(function (b) { b.onclick = function () { if ($('#fin').disabled) { aviso($('#falta').textContent || 'Faltan indicadores.'); return; } $('#fin').click(); }; });
    mejorarNumeros(); ITEMS.forEach(function (it) { pintarMedidor(it.id, E.resp[it.id]); }); pintarMedidor.listo = true; listasPrev = null;
    actualizar(); enfocar(0); mostrar('entrada', true); window.scrollTo(0, 0);
    $('#fin').onclick = function () {
      var db = leer(), id = E.id, edit = !!E.editando; delete E.editando;
      if (E._fotoNueva !== undefined) { if (E._fotoNueva) E.foto = new Date().toISOString(); else delete E.foto; fotoGuardar(id, E._fotoNueva || null); delete E._fotoNueva; }
      if (E.inicio && !edit) E.minutos = Math.max(1, Math.round((Date.now() - new Date(E.inicio).getTime()) / 60000));
      if (edit) { E.corregida = new Date().toISOString(); db.evals = db.evals.map(function (x) { return x.id === id ? E : x; }); }
      else { E.fecha = new Date().toISOString(); db.evals.push(E); }
      escribir(db); guardarBorrador(null); encolar([id]); subir(); E = null; document.onkeydown = null;
      if (edit) ir('informe', id); else vRevelar(id);
    };
  }

  /* ================================================================ diagnóstico */
  /* Canales que se revisaron: enlaces registrados y canales con teléfono, dirección u horario anotados */
  var NOM_CANAL = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', maps: 'Google Maps', whatsapp: 'WhatsApp', web: 'Sitio web' };
  function canalesRevisados(ev) {
    var c = Object.keys(ev.links || {}).filter(function (k) { return ev.links[k]; }).map(function (k) { return NOM_CANAL[k] || k; }), nap = ((ev.datos || {}).entrada || {}).nap || {};
    Object.keys(nap).forEach(function (k) { var r = nap[k] || {}; if ((r.tel || r.dir || r.hor || '').trim() && c.indexOf(k) < 0) c.push(k); });
    if ((ev.datos || {}).ficha && c.indexOf('Google Maps') < 0 && ev.datos.ficha.indexOf('Tiene ficha') >= 0) c.push('Google Maps');
    if (ev.red && c.indexOf(ev.red) < 0) c.unshift(ev.red);
    var e = (ev.datos || {}).entrada || {}; if ((e.ia1 || e.ia2) && c.indexOf('ChatGPT') < 0) c.push('ChatGPT');
    return c;
  }
  function contexto(ev) {
    var p = puntajes(ev.resp), recs = recomendaciones(ev.resp, ev), top = recs.slice(0, 3);
    return { p: p, nivel: nivelDe(p.indice), recs: recs, proy: top.length ? proyectar(ev.resp, top.map(function (r) { return r.it.id; })) : null, rubroCorto: ev.rubro === 'Otro' ? ev.rubroDetalle : rubroDe(ev.rubro)[3] };
  }
  function lecturaDe(ev) { if (!RD) return []; try { return RD.lectura(ev, contexto(ev)); } catch (e) { return []; } }
  function htmlLectura(ev) {
    var L = lecturaDe(ev); if (!L.length) return '';
    return '<div class="tarjeta bloque lectura"><div class="lect-ico">' + LOGO_ICONO + '</div><div><h3>Lo que Marki encontró</h3>' + L.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') +
      '<small>Cada frase sale de un dato registrado en la evaluación, con las reglas de la rúbrica de Marki.</small></div></div>';
  }
  function punto(t) { t = String(t || ''); return /[.!?…]$/.test(t) ? t : t + '.'; }
  function datosObservados(ev) {
    var d = ev.datos || {}, out = [];
    if (ev.seguidores != null) out.push(['Seguidores en ' + ev.red, ev.seguidores.toLocaleString('es-BO')]);
    if (d.posts30 != null) out.push(['Publicaciones en 30 días', d.posts30]);
    if (d.formatos && d.formatos.length) out.push(['Formatos', d.formatos.map(function (x) { return ETIQ_OP[x] || x; }).join(', ')]);
    if (d.resenas != null) out.push(['Reseñas en Google', d.resenas]);
    if (d.calificacion != null && d.resenas) out.push(['Calificación en Google', f1(d.calificacion) + ' / 5']);
    if (d.respuesta_min != null) out.push(['Respuesta a un mensaje', tiempoCorto(d.respuesta_min)]);
    if (d.ficha) out.push(['Ficha de Google', d.ficha.indexOf('Tiene ficha') < 0 ? 'No tiene' : (d.ficha.length - 1) + ' de 5 datos completos']);
    if (ev.google) out.push(['Fuente de la ficha', 'Google Maps, ' + fecha(ev.google.fecha)]);
    return out;
  }
  function vInforme(id) {
    var db = leer(), ev = buscar(id); if (!ev) return vPanel();
    var otros = unaPorNegocio(estudio(db, ev.id)).filter(function (e) { return e.codigo !== ev.codigo; });
    var p = puntajes(ev.resp), nv = nivelDe(p.indice), ref = referencia(otros), refR = referencia(otros.filter(function (e) { return e.rubro === ev.rubro; }));
    var recs = recomendaciones(ev.resp, ev), fort = fortalezas(ev.resp), obs = datosObservados(ev);
    var pctl = ref ? Math.round(ref.indices.filter(function (x) { return x < p.indice; }).length / ref.indices.length * 100) : null;
    var dimOrd = DIMS.slice().sort(function (a, b) { return (p.dims[b.id] || 0) - (p.dims[a.id] || 0); });
    var resto = recs.slice(3), top3 = recs.slice(0, 3), proy3 = top3.length ? proyectar(ev.resp, top3.map(function (r) { return r.it.id; })) : null;
    var PL = RD ? RD.plan(recs) : { semanas: [], despues: [] }, plan = PL.semanas;
    var cree = ev.estimacion != null ? Math.round(p.indice) - ev.estimacion : null;
    var links = canalesRevisados(ev).map(function (k) { return '<span>' + esc(k) + '</span>'; }).join('');
    var guardada = db.evals.some(function (x) { return x.id === ev.id; });
    var h = cab('') + '<main><div class="informe"><div class="tarjeta">' +
      '<div class="inf-cab"><div class="inf-marca">' + (guardada ? '<div class="av-wrap">' + avatarHTML(ev) + '<button class="av-cam no-imp" id="infFoto" title="' + (fotoDe(ev) ? 'Cambiar la foto del lugar' : 'Agregar una foto del lugar') + '" aria-label="' + (fotoDe(ev) ? 'Cambiar la foto del lugar' : 'Agregar una foto del lugar') + '"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M9 4 7.2 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.2L15 4H9zm3 4.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/></svg></button><input type="file" id="infFotoIn" accept="image/*" hidden></div>' : avatarHTML(ev)) + '<div><span class="eyebrow">Diagnóstico de presencia digital</span><h1>' + esc(ev.nombre) + '</h1><div class="sub" style="margin:0">' + esc(rubroTexto(ev)) + ' · Cobija, Pando</div>' + (links ? '<div class="links-r">Canales revisados: ' + links + '</div>' : '') + '</div></div>' +
      '<div class="meta"><img class="logo-imp" src="marki-logo.png" alt="Marki">' + etiquetaDemo(ev) + 'Fecha: ' + fecha(ev.fecha) + '<br>Indicadores evaluados: ' + p.evaluados + ' de ' + ITEMS.length + (function (n) { return n ? '<br>' + n + ' de ' + ITEMS.length + ' decididos por Marki' : ''; })(Object.keys(ev.auto || {}).filter(function (k) { return ev.auto[k]; }).length) + (ev.minutos ? '<br>Tiempo de revisión: ' + ev.minutos + ' min' : '') + '</div></div>' +
      '<div class="res bloque">' + anillo(p.indice, 'de 100 puntos', true) + '<div><span class="nivel n' + nv.k + '">Nivel ' + nv.n.nombre + '</span><p style="margin:0 0 6px;font-size:16px">' + esc(nv.n.texto) + '</p>' +
      (ref ? '<p class="nota" style="margin:0">El promedio de los ' + ref.n + ' negocios del estudio es ' + f0(ref.indice) + (refR ? ' y el de su rubro, ' + f0(refR.indice) : '') + '. Esta marca supera al ' + pctl + ' % de los negocios del estudio.</p>' : '<p class="nota" style="margin:0">La comparación con Cobija aparece cuando el estudio tenga al menos 3 negocios evaluados.</p>') +
      '<div class="escalera">' + R.niveles.map(function (n, i) { return '<div class="' + (i === nv.k ? 'on n' + i : '') + '">' + n.nombre + '<br>' + n.min + '–' + n.max + '</div>'; }).join('') + '</div></div></div>' +
      (cree != null ? '<div class="cree-bar"><div><small>El dueño creía tener</small><b>' + ev.estimacion + '</b></div><div><small>Su presencia digital real</small><b>' + f0(p.indice) + '</b></div><p>' +
        (Math.abs(cree) <= 5 ? 'El dueño conoce bien su presencia digital: su estimación casi coincide con el resultado.' : cree < 0 ? 'El dueño cree estar <b>' + (-cree) + ' puntos</b> por encima de lo que un cliente encuentra en internet.' : 'El negocio está <b>' + cree + ' puntos</b> por encima de lo que el dueño creía.') + '</p></div>' : '') + '</div>' +
      htmlLectura(ev) + htmlChat(ev) + '<div class="dos"><div class="tarjeta bloque"><h3>Resultado por dimensión</h3>' + radarSVG(p.dims, ref && ref.dims, { w: 380, h: 320, anim: true }) +
      '<div class="leyenda"><span><i></i>' + esc(ev.nombre) + '</span>' + (ref ? '<span><i class="c"></i>Promedio de Cobija</span>' : '') + '</div></div>' +
      '<div class="tarjeta bloque"><h3>Puntaje de 0 a 100</h3><div class="barras" style="margin-top:12px">' + dimOrd.map(function (d) { var v = p.dims[d.id], r = ref && ref.dims[d.id];
        return '<div class="barra"><span>' + esc(d.nombre) + '</span><div class="t"><i style="width:' + (v || 0) + '%;background:' + (v == null ? 'transparent' : COL[nivelDe(v).k]) + '"></i>' + (r != null ? '<u style="left:' + r + '%"></u>' : '') + '</div><b>' + f0(v) + '</b></div>'; }).join('') +
      '</div>' + (ref ? '<div class="leyenda"><span><i class="c" style="width:2px;height:12px;border:0;background:#0E1525"></i>Promedio de Cobija</span></div>' : '') +
      (obs.length ? '<h3 style="margin-top:18px">Datos observados</h3><div class="obs">' + obs.map(function (o) { return '<div><small>' + esc(o[0]) + '</small><b>' + esc(o[1]) + '</b></div>'; }).join('') + '</div>' : '') + '</div></div>' +
      '<div class="tarjeta listas bloque"><div class="dos"><div class="fort"><h3>Lo que ya haces bien</h3>' + (fort.length ? '<ol>' + fort.slice(0, 3).map(function (it) { return '<li><div>' + esc(it.nombre) + '<small>' + esc((RD && RD.evidencia(ev, it.id)) || punto(it.n[2])) + '</small></div></li>'; }).join('') + '</ol>' : '<p class="sub">Ningún indicador llega todavía al nivel más alto. Las acciones de «Por dónde empezar» son el mejor punto de partida.</p>') + '</div>' +
      '<div class="recs"><h3>Por dónde empezar</h3>' + (recs.length ? '<ol>' + recs.slice(0, 3).map(function (r) { return '<li><div>' + esc(r.texto) + (r.visto ? '<span class="visto"><b>Lo que vimos:</b> ' + esc(r.visto) + '</span>' : '') + '<small>' + esc(r.it.nombre) + ' · impacto <span class="etq i-' + r.it.impacto + '">' + r.it.impacto + '</span> · esfuerzo <span class="etq e-' + r.it.esfuerzo + '">' + r.it.esfuerzo + '</span></small></div></li>'; }).join('') + '</ol>' : '<p class="sub">Todos los indicadores evaluados están en el nivel más alto.</p>') +
      (proy3 ? '<p class="proy">Si cumples ' + (top3.length === 1 ? 'esta acción' : 'estas ' + top3.length + ' acciones') + ', tu índice pasaría de <b>' + f0(p.indice) + '</b> a <b>' + f0(proy3.indice) + '</b> (nivel ' + nivelDe(proy3.indice).n.nombre + ').</p>' : '') + '</div></div></div>' +
      embudo(p) + htmlSimulador(ev, recs) +
      (plan.length ? '<div class="tarjeta bloque plan"><h3>Plan de mejora para los próximos 30 días</h3><p class="sub">Tres acciones por semana como máximo, en orden de prioridad: primero lo que más mejora el resultado con menos esfuerzo.</p>' + metas(ev) + '<div class="semanas s4">' + plan.map(function (s, i) {
        return '<div><span class="sem">' + s.t + '</span><b>' + s.s + '</b><ul>' + s.recs.map(function (r) { return '<li>' + (i === 0 ? '<b class="pl-n">' + esc(r.it.nombre) + '</b>' + '<small>Ver «Por dónde empezar»</small>' : esc(r.texto) + '<small>' + esc(r.it.nombre) + ' · impacto ' + r.it.impacto + '</small>') + '</li>'; }).join('') + '</ul></div>'; }).join('') + '</div>' +
        (PL.despues.length ? '<p class="nota despues"><b>Después del primer mes:</b> ' + esc(PL.despues.map(function (r) { return minus(r.it.nombre); }).join(', ')) + '.</p>' : '') + '</div>' : '') +
      (ev.origen === 'Demo' ? '' : htmlDevolucion(ev)) +
      '<div class="pie-inf">Diagnóstico elaborado con Marki, herramienta de diagnóstico de presencia digital (rúbrica v' + esc(ev.version || R.version) + ') a partir de la información pública de la marca observada el ' + fecha(ev.fecha) +
      '. Mide lo que un cliente puede ver en internet; no mide ventas ni calidad del producto. Universidad Amazónica de Pando · Carrera de Ingeniería Comercial · Marketing Digital (ICOM261).</div>' +
      '<div class="acciones no-imp"><button class="btn sec" data-ir="panel">← Resultados</button>' + (ev.origen === 'Demo' ? '' : '<button class="btn sec" id="corregir">Corregir la evaluación</button>') + '<span class="espacio"></span><button class="btn sec" id="env">Enviar al dueño</button><button class="btn sec" id="img">Imagen para redes</button><button class="btn sec" id="imp">Imprimir o guardar PDF</button><button class="btn pri" id="kit">Kit de mejora</button></div>' +
      '<div class="acciones no-imp" style="margin-top:8px"><span class="espacio"></span><button class="btn sec chico" data-ir="nueva">Evaluar otra marca</button></div></div></main>';
    app.innerHTML = h; enlazar(); $('#imp').onclick = function () { window.print(); };
    /* agregar o cambiar la foto del lugar en una evaluación ya guardada */
    if (guardada) { var fIn = $('#infFotoIn'); $('#infFoto').onclick = function () { fIn.click(); };
      fIn.onchange = function () { var f = fIn.files && fIn.files[0]; fIn.value = ''; if (!f) return;
        comprimirFoto(f).then(function (url) { var d = leer(); d.evals.forEach(function (x) { if (x.id === ev.id) x.foto = new Date().toISOString(); });
          return fotoGuardar(ev.id, url).then(function () { escribir(d); encolar([ev.id]); subirPronto(); aviso('Foto del lugar guardada.', 'okk'); vInforme(ev.id); }); })
          .catch(function (e) { aviso(e.message, 'err'); }); }; }
    $('#kit').onclick = function () { ir('kit', ev.id); };
    if ($('#corregir')) $('#corregir').onclick = function () { E = JSON.parse(JSON.stringify(ev)); E.editando = true; vDatos(E); };
    $('#img').onclick = function () { imagenRedes(ev); }; $('#env').onclick = function () { vEnviar(ev); };
    enlazarSimulador(ev, recs); enlazarDevolucion(ev); enlazarChat(ev);
  }

  /* ================================================================ revelación del resultado (momento del stand) */
  function vRevelar(id) {
    var ev = buscar(id); if (!ev) return ir('informe', id);
    var p = puntajes(ev.resp), nv = nivelDe(p.indice), T = vRevelar.t = [], listo = false;
    try { history.pushState(null, '', '#informe/' + id); } catch (e) {}
    document.body.classList.add('revelar'); window.scrollTo(0, 0);
    app.innerHTML = '<div class="rev" id="rev"><div class="rev-in"><div class="rev-izq"><span class="rev-eye">' + LOGO_BLANCO + '<span>Diagnóstico de presencia digital</span></span>' + etiquetaDemo(ev) + '<h1>' + esc(ev.nombre) + '</h1>' +
      '<p class="rev-estado" id="rest">Revisando lo que un cliente ve en internet…</p><div class="rev-dims">' + DIMS.map(function (d) {
        return '<div class="rev-d" data-d="' + d.id + '"><span>' + esc(d.nombre) + '</span><div class="t"><i></i></div><b>·</b></div>'; }).join('') + '</div>' +
      '<p class="rev-salto">Toca la pantalla para ver el resultado de inmediato</p></div><div class="rev-der"><div class="rev-scan" aria-hidden="true"><i></i><b>' + LOGO_ICONO + '</b></div>' +
      '<div class="rev-fin" id="rfin"><div class="rev-ring">' + anillo(0, 'de 100', true) + '</div><div class="rev-txt"><span class="nivel n' + nv.k + '">Nivel ' + nv.n.nombre + '</span><p>' + esc(nv.n.texto) + '</p>' +
      (RD && RD.hallazgo(ev, recomendaciones(ev.resp, ev)) ? '<p class="rev-hall"><b>Lo que Marki encontró:</b> ' + esc(RD.hallazgo(ev, recomendaciones(ev.resp, ev))) + '</p>' : '') +
      (ev.estimacion != null ? '<div class="rev-cree"><div><small>El dueño creía</small><b>' + ev.estimacion + '</b></div><div><small>Presencia real</small><b>' + f0(p.indice) + '</b></div><div><small>Diferencia</small><b class="' + (ev.estimacion > p.indice ? 'menos' : 'mas') + '">' + (Math.round(p.indice) - ev.estimacion > 0 ? '+' : '') + (Math.round(p.indice) - ev.estimacion) + '</b></div></div>' : '') +
      '<div class="acciones"><button class="btn pri grande" id="rver">Ver el diagnóstico completo</button><button class="btn sec grande" id="rkit">Llévate tu kit</button><button class="btn sec grande" id="renv">Enviar al dueño</button></div></div></div></div></div></div>';
    function dim(i) { var d = DIMS[i], v = p.dims[d.id], el = app.querySelector('[data-d="' + d.id + '"]'); if (!el) return;
      el.classList.add('on'); el.querySelector('i').style.width = (v || 0) + '%'; el.querySelector('i').style.background = v == null ? 'transparent' : COL[nivelDe(v).k]; el.querySelector('b').textContent = f0(v);
      var st = $('#rest'); if (st) st.textContent = 'Revisando: ' + d.nombre.toLowerCase() + '…'; }
    function final() {
      if (listo) return; listo = true; T.forEach(clearTimeout); for (var i = 0; i < DIMS.length; i++) dim(i);
      var st = $('#rest'); if (st) st.textContent = 'Resultado';
      $('#rev').classList.add('fin'); var ring = app.querySelector('.rev-ring .anillo'), num = ring.querySelector('b'), meta = p.indice || 0, t0 = performance.now();
      ring.style.setProperty('--c', COL[nv.k]);
      (function paso(t) { var k = Math.min(1, (t - t0) / 1300), e = 1 - Math.pow(1 - k, 3), v = meta * e; ring.style.setProperty('--v', Math.round(v)); num.textContent = Math.round(v); if (k < 1 && app.contains(ring)) requestAnimationFrame(paso); })(t0);
    }
    for (var i = 0; i < DIMS.length; i++) T.push(setTimeout(dim.bind(null, i), 500 + i * 420));
    T.push(setTimeout(final, 500 + DIMS.length * 420 + 400));
    $('#rev').addEventListener('click', function (e) { if (!e.target.closest('button')) final(); });
    $('#rver').onclick = function () { ir('informe', id); }; $('#rkit').onclick = function () { ir('kit', id); }; $('#renv').onclick = function () { vEnviar(ev); };
  }

  /* ================================================================ simulador «¿y si mejoras?» */
  function proyectar(resp, ids) { var r2 = {}; Object.keys(resp).forEach(function (k) { r2[k] = resp[k]; }); ids.forEach(function (k) { r2[k] = 2; }); return puntajes(r2); }
  function htmlSimulador(ev, recs) {
    if (!recs.length) return '';
    var base = puntajes(ev.resp).indice;
    return '<div class="tarjeta bloque sim no-imp"><div class="sim-cab"><div><span class="eyebrow">Simulador</span><h3 style="font-size:22px">¿Y si mejoras?</h3><p class="sub" style="margin:0">Marca las acciones que te comprometes a hacer y mira cómo cambiaría tu índice.</p></div>' +
      '<div class="chips" id="simP"><button class="chip" data-p="top3">Las 3 prioritarias</button><button class="chip" data-p="rapidas">Todas las rápidas</button><button class="chip" data-p="todas">Todas</button><button class="chip" data-p="nada">Ninguna</button></div></div>' +
      '<div class="sim-g"><div class="sim-res"><div class="sim-num"><div><small>Hoy</small><b>' + f0(base) + '</b></div><span>→</span><div id="simA"></div></div><div id="simTxt" class="sim-txt"></div><div id="simR"></div>' +
      '<div class="leyenda"><span><i></i>Con las mejoras</span><span><i class="c"></i>Hoy</span></div></div>' +
      '<div class="sim-l">' + recs.map(function (r, i) { var d = proyectar(ev.resp, [r.it.id]).indice - base;
        return '<label class="sim-i' + (i >= 8 ? ' extra' : '') + '"><input type="checkbox" data-sim="' + r.it.id + '"><span class="sw"></span><div><b>' + esc(r.it.nombre) + '</b><small>' + esc(r.texto) + '</small></div><em>+' + f0(d) + '</em></label>'; }).join('') +
        (recs.length > 8 ? '<button class="btn sec chico" id="simMas">Ver ' + pl(recs.length - 8, 'acción', 'acciones') + ' más</button>' : '') + '</div></div></div>';
  }
  /* ================================================================ opinión del dueño (devolución de resultados) */
  var DEV_P = [['q1', '¿El diagnóstico describe bien la situación de tu negocio en internet?', 'escala'], ['q2', '¿Las acciones recomendadas te parecen útiles y posibles de hacer?', 'escala'], ['q3', '¿Aplicarás alguna en el próximo mes?', 'sn']];
  /* ================================================================ Pregúntale a Marki: conversación basada en reglas.
     Cada respuesta se arma con los datos de esta evaluación y el mismo motor del diagnóstico; no se usa un modelo de lenguaje y no inventa. */
  var ART = { D1: 'la identidad de marca', D2: 'la presencia en búsquedas', D3: 'el contenido en redes', D4: 'la interacción con clientes', D5: 'la reputación en línea', D6: 'la conversión a venta', D7: 'la publicidad y la medición' };
  var CHAT_PREG = { puntaje: '¿Por qué tengo este puntaje?', primero: '¿Qué hago primero?', subir: '¿Cuánto podría subir?', bien: '¿Qué hago bien?', cobija: '¿Cómo estoy frente a Cobija?', texto: 'Dame un texto para publicar' };
  function sinTilde(t) { try { return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) { return String(t).toLowerCase(); } }
  var CHAT_CLAVES = [
    ['hola', /^(hola|buen[oa]s( dias| tardes| noches)?|que tal|hey)[!.,\s]*$/], ['gracias', /^(gracias|muchas gracias|genial|excelente|perfecto|ok|okey|vale|listo|entendido)[!.,\s]*$|\bgracias\b/],
    ['marki', /marki|quien (lo |te )?(hizo|creo|desarrollo)|como funciona|de donde (sacan|salen|sacas)|mis datos|privacidad|es seguro|gratis|cuanto cuesta|costo|cobran/],
    ['texto', /\b(texto|copiar|biografia|plantilla|escribe(me)?|redacta|que pongo|que escribo)\b/],
    ['subir', /\b(subir|subo|subiria|aumentar|mejoraria|proyecc|simul)|cuanto (puedo|podria|sube|subiria)|mejorar mi (nota|puntaje|indice)/],
    ['puntaje', /mi resultado|como estoy|como me fue|que tal estoy|que tal me fue|salio (bajo|alto|mal|bien)|por que (salio|saque|tengo)|es bueno mi/],
    ['D5', /resena|estrella|reputacion|opinion(es)? de (los )?clientes/], ['D6', /precio|vender|venta|vendo|comprar|pedido|catalogo|delivery|envio/],
    ['D2', /google|maps|ficha|busca|chatgpt|\bia\b|inteligencia artificial|aparezco|encuentr/], ['D7', /anuncio|publicidad|pagina web|sitio web|\bweb\b|medir|promocion/],
    ['D4', /coment|interac|mensaje|whatsapp|responder|contestar|atiendo/], ['D3', /contenido|publicacion|publico|publicar|video|historia|frecuencia|formato|tiktok|facebook|instagram|\bredes\b|\bfotos?\b/],
    ['D1', /logo|identidad|colores|diseno|usuario|nombre de la marca|perfil/],
    ['cobija', /cobija|compar|otros negocios|los demas|competencia|promedio|mejor que/],
    ['plan', /\bplan\b|cuanto tiempo|en cuanto|30 dias|un mes|esta semana|por semana/],
    ['bien', /\b(bien|fortaleza|fuerte|bueno|destaco)\b/],
    ['puntaje', /puntaje|nota|indice|por que|porque|nivel|resultado|significa/], ['primero', /primero|empiezo|empezar|que hago|hacer|prioridad|recomiend|mejorar|consejo|ayuda|falta|clientes|vender mas/]];
  function chatIntencion(txt) { var t = sinTilde(txt).replace(/[¿?¡!]/g, ' ').replace(/\s+/g, ' ').trim(), r = t.replace(/^(hola|buen[oa]s( dias| tardes| noches)?)[,.\s]+/, '');
    if (r && r !== t && !CHAT_CLAVES[0][1].test(t)) t = r; /* «hola, ¿cómo estoy?» → se responde la pregunta, no el saludo */
    for (var i = 0; i < CHAT_CLAVES.length; i++) if (CHAT_CLAVES[i][1].test(t)) return CHAT_CLAVES[i][0]; return null; }
  function chatRespuesta(ev, k) {
    var p = puntajes(ev.resp), nv = nivelDe(p.indice), recs = recomendaciones(ev.resp, ev), b = function (x) { return '<b>' + esc(x) + '</b>'; };
    var conV = DIMS.filter(function (d) { return p.dims[d.id] != null; }).sort(function (a, c) { return p.dims[a.id] - p.dims[c.id]; });
    var ev2 = function (id) { var it = ITEM[id], v = ev.resp[id], t = (RD && RD.evidencia(ev, id)) || (v == null ? 'No se pudo evaluar.' : it.n[v]); t = punto(t);
      return /^(Google|ChatGPT|WhatsApp|Facebook|Instagram|TikTok|Meta|Marki|Cobija)\b/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1); }; /* va después de dos puntos */
    if (k === 'hola') return '¡Hola! Pregúntame lo que quieras sobre el diagnóstico de ' + b(ev.nombre) + ': por qué tiene ese puntaje, qué hacer primero o cuánto podría subir.';
    if (k === 'gracias') return '¡Con gusto! Si quieres, te doy un texto listo para publicar o te explico cualquier dimensión.';
    if (k === 'marki') return 'Soy Marki, una herramienta de la Carrera de Ingeniería Comercial de la UAP (asignatura Marketing Digital). Reviso solo lo que cualquier cliente puede ver de tu negocio en internet: redes sociales, Google Maps y ChatGPT. Califico 21 indicadores con reglas fijas y te doy un diagnóstico y un plan. ' +
      'El diagnóstico es gratuito. No guardo tu teléfono ni tu correo, y en la investigación los resultados se usan de forma anónima y agrupada.';
    if (k === 'plan') {
      if (!recs.length) return 'No tienes acciones pendientes: mantén la constancia y revisa tu presencia cada mes.';
      var rap2 = recs.filter(function (x) { return x.it.esfuerzo === 'bajo'; }).slice(0, 3), prT = proyectar(ev.resp, recs.map(function (x) { return x.it.id; }).slice(0, 6));
      return (rap2.length ? 'Esta misma semana puedes hacer lo más sencillo: ' + rap2.map(function (x) { return b(minus(x.it.nombre)); }).join(', ') + '. ' : '') +
        'Tu plan de mejora es para 30 días, con hasta tres acciones por semana. Si cumples las primeras ' + Math.min(6, recs.length) + ' acciones, tu índice pasaría de ' + b(f0(p.indice)) + ' a ' + b(f0(prT.indice)) + '.' +
        '<br><span class="ch-visto">Lo ves completo en «Plan de mejora», más abajo en este diagnóstico.</span>';
    }
    if (k === 'puntaje') {
      var sig = R.niveles[nv.k + 1], deb = conV.filter(function (d) { return p.dims[d.id] < 100; }).slice(0, 2);
      var h = 'Tu índice es ' + b(f0(p.indice) + ' de 100') + ': nivel ' + b(nv.n.nombre) + ' (' + nv.n.min + ' a ' + nv.n.max + '). ' + esc(nv.n.texto);
      if (deb.length) { h += '<br>Lo que más te baja es ' + deb.map(function (d) { return esc(ART[d.id]) + ' (' + f0(p.dims[d.id]) + ')'; }).join(' y ') + '.';
        var it0 = dimDe(deb[0].id).items.filter(function (it) { return ev.resp[it.id] === 0 || ev.resp[it.id] === 1; }).sort(function (a, c) { return ev.resp[a.id] - ev.resp[c.id]; })[0];
        if (it0) h += ' Por ejemplo, en ' + minus(it0.nombre) + ': ' + esc(ev2(it0.id)); }
      return h + (sig ? '<br>Para llegar al nivel ' + b(sig.nombre) + ' te faltan ' + b(String(sig.min - Math.round(p.indice))) + ' puntos.' : '<br>Ya estás en el nivel más alto: el reto es mantenerlo.');
    }
    if (k === 'primero') {
      if (!recs.length) return 'Todos los indicadores evaluados ya están en el nivel más alto. Lo que sigue es mantener la constancia y medir qué te trae más clientes.';
      var r = recs[0];
      return 'Empieza por ' + b(minus(r.it.nombre)) + ': ' + esc(r.texto) + (r.visto ? '<br><span class="ch-visto">Lo que vimos: ' + esc(r.visto) + '</span>' : '') +
        '<br>Impacto ' + esc(r.it.impacto) + ' y esfuerzo ' + esc(r.it.esfuerzo) + '.' + (recs[1] ? ' Después sigue con ' + b(minus(recs[1].it.nombre)) + '.' : '');
    }
    if (k === 'subir') {
      if (!recs.length) return 'Tu índice ya es ' + b(f0(p.indice)) + ': todos los indicadores evaluados están en el máximo.';
      var top = recs.slice(0, 3), pr = proyectar(ev.resp, top.map(function (x) { return x.it.id; })), rap = recs.filter(function (x) { return x.it.esfuerzo === 'bajo'; }), pr2 = rap.length > top.length ? proyectar(ev.resp, rap.map(function (x) { return x.it.id; })) : null;
      return 'Si cumples ' + (top.length === 1 ? 'la acción prioritaria' : 'las ' + top.length + ' acciones prioritarias') + ', tu índice pasaría de ' + b(f0(p.indice)) + ' a ' + b(f0(pr.indice)) + ' (nivel ' + esc(nivelDe(pr.indice).n.nombre) + ').' +
        (pr2 ? '<br>Si además haces todas las de esfuerzo bajo (' + rap.length + '), llegarías a ' + b(f0(pr2.indice)) + ' (nivel ' + esc(nivelDe(pr2.indice).n.nombre) + ').' : '') +
        '<br><span class="ch-visto">Es una proyección con las reglas de Marki: supone que cada acción lleva su indicador al nivel más alto.</span>';
    }
    if (k === 'bien') {
      var f = fortalezas(ev.resp).slice(0, 3);
      if (!f.length) return 'Todavía ningún indicador llega al nivel más alto. Tu mejor dimensión es ' + esc(ART[conV[conV.length - 1].id]) + ' (' + f0(p.dims[conV[conV.length - 1].id]) + '): es una buena base para crecer.';
      return 'Esto ya lo haces muy bien:<ul>' + f.map(function (it) { return '<li>' + b(it.nombre) + ': ' + esc(ev2(it.id)) + '</li>'; }).join('') + '</ul>';
    }
    if (k === 'cobija') {
      var ref = referencia(unaPorNegocio(estudio(leer(), ev.id)).filter(function (e) { return e.codigo !== ev.codigo; }));
      if (!ref) return 'La comparación con Cobija aparece cuando el estudio tenga al menos 3 negocios evaluados. Por ahora, tu índice es ' + b(f0(p.indice)) + '.';
      var dif = Math.round(p.indice) - Math.round(ref.indice), pc = Math.round(ref.indices.filter(function (x) { return x < p.indice; }).length / ref.indices.length * 100);
      var ds = conV.filter(function (d) { return ref.dims[d.id] != null; }).map(function (d) { return { d: d, x: p.dims[d.id] - ref.dims[d.id] }; }).sort(function (a, c) { return c.x - a.x; });
      return 'El promedio de los ' + ref.n + ' negocios del estudio es ' + b(f0(ref.indice)) + ' y tú tienes ' + b(f0(p.indice)) + (dif === 0 ? ': estás justo en el promedio.' : ': ' + Math.abs(dif) + ' puntos ' + (dif > 0 ? 'por encima.' : 'por debajo.')) + ' Superas al ' + pc + ' % de los negocios evaluados.' +
        (ds.length > 1 ? '<br>Donde más te destacas: ' + esc(ART[ds[0].d.id]) + '. Donde más te falta frente a Cobija: ' + esc(ART[ds[ds.length - 1].d.id]) + '.' : '');
    }
    if (k === 'texto') {
      var T = RD ? RD.kit(ev, contexto(ev)) : plantillas(ev), x = T.filter(function (t) { return /publicaci/i.test(t.t); })[0] || T[0];
      if (!x) return 'Encontrarás los textos listos en el kit de mejora.';
      return 'Aquí tienes uno con los datos de ' + b(ev.nombre) + ' (' + esc(minus(x.t)) + '). Cambia lo que está entre corchetes:<pre class="ch-pre">' + esc(x.x) + '</pre><button class="btn sec chico" data-chcopiar>Copiar el texto</button> <button class="btn sec chico" data-ir-kit>Ver todos en el kit</button>';
    }
    if (/^D\d$/.test(k)) {
      var d = dimDe(k);
      return 'En ' + esc(ART[k]) + ' tienes ' + b(p.dims[k] == null ? 'no evaluable' : f0(p.dims[k]) + ' de 100') + '. ' + esc(d.pregunta) + '<ul>' + d.items.map(function (it) { var v = ev.resp[it.id];
        return '<li><i class="ch-n n' + (v == null ? 'x' : v) + '">' + (v == null ? '–' : v) + '</i>' + b(it.nombre) + ': ' + esc(ev2(it.id)) + '</li>'; }).join('') + '</ul>' +
        (recs.filter(function (r) { return r.it.dim === k; })[0] ? 'Lo primero aquí: ' + esc(recs.filter(function (r) { return r.it.dim === k; })[0].texto) : 'En esta dimensión no tienes acciones pendientes.');
    }
    return 'Esa pregunta no la sé responder: solo respondo con los datos de este diagnóstico. Prueba con una de estas:';
  }
  function htmlChat(ev) {
    return '<div class="tarjeta bloque chat no-imp" id="chat"><div class="ch-cab"><span class="ch-av">' + LOGO_ICONO + '</span><div><h3>Pregúntale a Marki</h3><small>Responde con los datos de este diagnóstico. No inventa: cada respuesta sale de lo registrado en la evaluación.</small></div></div>' +
      '<div class="ch-log" id="chLog" aria-live="polite"></div><div class="ch-chips" id="chChips"></div>' +
      '<form class="ch-form" id="chForm" autocomplete="off"><input id="chIn" maxlength="140" placeholder="Escribe tu pregunta…" aria-label="Tu pregunta para Marki"><button class="btn pri" type="submit">Preguntar</button></form></div>';
  }
  function enlazarChat(ev) {
    var log = $('#chLog'), chips = $('#chChips'), usadas = {}; if (!log) return;
    var p = puntajes(ev.resp), deb = DIMS.filter(function (d) { return p.dims[d.id] != null && p.dims[d.id] < 100; }).sort(function (a, c) { return p.dims[a.id] - p.dims[c.id]; })[0];
    var preg = function () { var L = Object.keys(CHAT_PREG).map(function (k) { return [k, CHAT_PREG[k]]; }); if (deb) L.splice(1, 0, [deb.id, '¿Qué pasa con ' + ART[deb.id] + '?']); return L; };
    function burbuja(quien, html) { var d = document.createElement('div'); d.className = 'ch-m ' + quien; d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
    function pintarChips() { var L = preg().filter(function (x) { return !usadas[x[0]]; }); if (!L.length) { usadas = {}; L = preg(); }
      chips.innerHTML = L.map(function (x) { return '<button type="button" class="ch-chip" data-k="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('');
      chips.querySelectorAll('[data-k]').forEach(function (c) { c.onclick = function () { preguntar(c.textContent, c.dataset.k); }; }); }
    function preguntar(txt, k) {
      burbuja('yo', esc(txt)); k = k || chatIntencion(txt); if (k) usadas[k] = 1;
      var esp = burbuja('marki escribe', '<i></i><i></i><i></i>'); chips.innerHTML = '';
      setTimeout(function () { esp.className = 'ch-m marki'; try { esp.innerHTML = chatRespuesta(ev, k); } catch (e) { esp.textContent = 'No pude armar esa respuesta. Prueba con otra pregunta.'; }
        var c = esp.querySelector('[data-chcopiar]'); if (c) c.onclick = function () { var t = esp.querySelector('.ch-pre').textContent; if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { aviso('Texto copiado.', 'okk'); }, function () { aviso('Selecciona el texto y cópialo a mano.'); }); else aviso('Selecciona el texto y cópialo a mano.'); };
        var kk = esp.querySelector('[data-ir-kit]'); if (kk) kk.onclick = function () { ir('kit', ev.id); };
        log.scrollTop = log.scrollHeight; pintarChips(); }, 650);
    }
    burbuja('marki', 'Hola, soy Marki. Ya revisé ' + '<b>' + esc(ev.nombre) + '</b>. ¿Qué quieres saber?'); pintarChips();
    $('#chForm').onsubmit = function (e) { e.preventDefault(); var i = $('#chIn'), t = i.value.trim(); if (!t) return; i.value = ''; preguntar(t); };
  }
  function htmlDevolucion(ev) {
    var d = ev.devolucion || {};
    return '<div class="tarjeta bloque devol no-imp" id="devol"><h3>Opinión del dueño</h3><p class="sub">Pregúntale al dueño después de mostrarle el diagnóstico. Toma 30 segundos y sirve para validar Marki con quienes lo usan.</p>' +
      DEV_P.map(function (q) { return '<div class="dq"><b>' + q[1] + '</b><div class="dq-op" data-dq="' + q[0] + '">' +
        (q[2] === 'escala' ? [1, 2, 3, 4, 5].map(function (v) { return '<button class="' + (d[q[0]] === v ? 'on' : '') + '" data-v="' + v + '">' + v + '</button>'; }).join('') + '<small>1 = nada · 5 = totalmente</small>'
          : [['si', 'Sí'], ['tal vez', 'Tal vez'], ['no', 'No']].map(function (o) { return '<button class="' + (d[q[0]] === o[0] ? 'on' : '') + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('')) + '</div></div>'; }).join('') +
      '<p class="nota" id="devEst">' + (d.fecha ? 'Respuesta guardada.' : 'Aún sin respuesta.') + '</p></div>';
  }
  function enlazarDevolucion(ev) {
    $$('[data-dq]').forEach(function (g) { g.onclick = function (e) { var b = e.target.closest('button'); if (!b) return;
      var q = g.dataset.dq, v = /^\d$/.test(b.dataset.v) ? +b.dataset.v : b.dataset.v, db = leer();
      db.evals.forEach(function (x) { if (x.id === ev.id) { x.devolucion = x.devolucion || {}; x.devolucion[q] = x.devolucion[q] === v ? undefined : v; x.devolucion.fecha = new Date().toISOString(); ev.devolucion = x.devolucion; } });
      escribir(db); g.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', String(ev.devolucion[q]) === x.dataset.v); });
      $('#devEst').textContent = 'Respuesta guardada.'; encolar([ev.id]); subir(); }; });
  }
  function resumenDevolucion(db) {
    var R0 = db.evals.map(function (e) { return e.devolucion; }).filter(function (d) { return d && (d.q1 || d.q2 || d.q3); });
    var acu = function (k) { var l = R0.filter(function (d) { return d[k]; }); return l.length ? { n: l.length, pct: l.filter(function (d) { return d[k] >= 4; }).length / l.length * 100, media: media(l.map(function (d) { return d[k]; })) } : null; };
    var l3 = R0.filter(function (d) { return d.q3; });
    return { n: R0.length, q1: acu('q1'), q2: acu('q2'), q3: l3.length ? { n: l3.length, si: l3.filter(function (d) { return d.q3 === 'si'; }).length / l3.length * 100, tv: l3.filter(function (d) { return d.q3 === 'tal vez'; }).length / l3.length * 100 } : null };
  }

  function enlazarSimulador(ev, recs) {
    if (!$('#simA')) return;
    var base = puntajes(ev.resp);
    function pintar() {
      var ids = $$('[data-sim]').filter(function (c) { return c.checked; }).map(function (c) { return c.dataset.sim; }), p2 = proyectar(ev.resp, ids), nv = nivelDe(p2.indice), d = p2.indice - base.indice;
      $('#simA').innerHTML = anillo(p2.indice, 'proyectado'); $('#simR').innerHTML = radarSVG(p2.dims, base.dims, { w: 330, h: 270, margen: 62 });
      $('#simTxt').innerHTML = ids.length ? 'Con <b>' + ids.length + (ids.length === 1 ? ' acción' : ' acciones') + '</b> el índice subiría <b>' + f0(d) + ' puntos</b>, a nivel <span class="pill-n n' + nv.k + '">' + nv.n.nombre + '</span>' : 'Activa una o más acciones de la lista.';
    }
    $$('[data-sim]').forEach(function (c) { c.onchange = pintar; });
    var mas = $('#simMas'); if (mas) mas.onclick = function () { $('.sim-l').classList.add('todo'); mas.remove(); };
    $$('#simP .chip').forEach(function (b) { b.onclick = function () {
      var p = b.dataset.p, top = recs.slice(0, 3).map(function (r) { return r.it.id; });
      $$('[data-sim]').forEach(function (c) { var r = recs.filter(function (x) { return x.it.id === c.dataset.sim; })[0];
        c.checked = p === 'todas' || (p === 'top3' && top.indexOf(c.dataset.sim) >= 0) || (p === 'rapidas' && r.it.esfuerzo === 'bajo'); });
      $$('#simP .chip').forEach(function (x) { x.classList.toggle('on', x === b && p !== 'nada'); }); pintar(); }; });
    pintar();
  }

  /* ================================================================ kit de mejora: QR y textos listos para usar */
  function qrSVG(texto, px) {
    if (!window.qrcode) return '<div class="qr-err">QR no disponible</div>';
    try { var q = window.qrcode(0, texto.length > 220 ? 'L' : 'M'); q.addData(texto); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }).replace('<svg ', '<svg class="qr" style="width:' + (px || 150) + 'px;height:' + (px || 150) + 'px" '); }
    catch (e) { return '<div class="qr-err">El texto es demasiado largo para un QR</div>'; }
  }
  function numWA(t) { var n = String(t || '').replace(/[^0-9]/g, ''); if (n.length === 8) n = '591' + n; return n; }
  function textoResumen(ev) {
    var p = puntajes(ev.resp), nv = nivelDe(p.indice), recs = recomendaciones(ev.resp).slice(0, 3);
    /* Texto corto a propósito: cada letra con tilde ocupa 6 caracteres en el enlace y un QR muy denso no se puede leer */
    var t = 'MARKI - ' + ev.nombre.slice(0, 32) + '\nPresencia digital: ' + f0(p.indice) + '/100, nivel ' + nv.n.nombre +
      (recs.length ? '\nEmpieza por: ' + recs.map(function (r) { return r.it.nombre; }).join('; ') : '') + '\nUAP - Marketing Digital';
    try { t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
    return t;
  }
  var CORTO_RUBRO = { 'Restaurante o comida': 'Comida', 'Cafetería, heladería o panadería': 'Cafetería y postres', 'Hospedaje': 'Hospedaje', 'Tienda o comercio': 'Tienda', 'Servicios': 'Servicios', 'Otro': '' };
  function plantillas(ev) {
    var r = ev.resp, n = ev.nombre, wa = ev.links && ev.links.whatsapp ? '+' + numWA(ev.links.whatsapp) : '[tu número]', rub = (ev.rubro === 'Otro' ? ev.rubroDetalle : rubroDe(ev.rubro)[3]) || CORTO_RUBRO[ev.rubro] || 'Tu negocio';
    var resena = ev.google && ev.google.id ? 'https://search.google.com/local/writereview?placeid=' + ev.google.id : '[enlace de tu ficha de Google]';
    var flojo = function (id) { return r[id] === 0 || r[id] === 1; };
    var L = [];
    L.push({ t: 'Biografía para tus redes', p: 'Perfil de Facebook, Instagram y TikTok', x: n + ' · ' + rub + ' en Cobija 📍\n🕒 Atendemos: [días y horario]\n📲 Pedidos por WhatsApp: ' + wa + '\n👇 Escríbenos y te respondemos al instante', f: flojo('D2.2') || flojo('D6.3') || flojo('D1.3') });
    L.push({ t: 'Mensaje de bienvenida de WhatsApp Business', p: 'Herramientas para la empresa → Mensaje de bienvenida', x: '¡Hola! 👋 Gracias por escribir a ' + n + '. En un momento te atendemos.\nMientras tanto, mira nuestro catálogo aquí en WhatsApp. ¿Qué te gustaría pedir hoy?', f: flojo('D4.3') });
    L.push({ t: 'Respuesta rápida de precios', p: 'WhatsApp Business → Respuestas rápidas (atajo /precios)', x: '¡Claro! Estos son nuestros precios de esta semana:\n• [producto 1]: Bs [precio]\n• [producto 2]: Bs [precio]\n¿Te lo preparamos? Puedes pagar con QR 📲', f: flojo('D6.1') });
    L.push({ t: 'Pedido de reseña a un cliente', p: 'Envíalo por WhatsApp después de cada compra', x: '¡Gracias por tu compra en ' + n + '! 🙌 ¿Nos ayudas con una reseña en Google? Toma menos de un minuto y ayuda a que más personas de Cobija nos encuentren:\n' + resena, f: flojo('D5.1') || flojo('D5.2') });
    L.push({ t: 'Respuesta a una reseña positiva', p: 'Google Maps → Reseñas → Responder', x: '¡Muchas gracias por tu reseña, [nombre]! Nos alegra que te haya gustado [producto]. Te esperamos pronto en ' + n + '.', f: flojo('D5.3') });
    L.push({ t: 'Respuesta a una reseña negativa', p: 'Responde con calma, sin discutir', x: 'Hola, [nombre]. Lamentamos que tu experiencia no haya sido buena y gracias por avisarnos. Ya estamos corrigiendo [problema]. Escríbenos al ' + wa + ' para compensarte en tu próxima visita.', f: flojo('D5.3') || flojo('D5.2') });
    L.push({ t: 'Publicación con llamado a la acción', p: 'Termina siempre diciendo qué hacer para comprar', x: '[Foto o video del producto]\n✨ [Nombre del producto]: [qué lo hace especial]\n💰 Bs [precio]\n📲 Pide ahora por WhatsApp: ' + wa + '\n📍 [dirección], Cobija', f: flojo('D6.2') || flojo('D6.1') || flojo('D3.3') });
    L.push({ t: 'Promoción que se puede medir', p: 'Usa una palabra clave distinta en cada promoción', x: '🎉 Solo para nuestros seguidores: dinos la palabra «MARKI» al pagar y recibe [beneficio].\nVálido hasta el [fecha].\nAsí sabremos cuántos clientes llegan por esta publicación.', f: flojo('D7.3') });
    L.push({ t: 'Calendario simple de publicaciones', p: 'Dos publicaciones por semana, en días fijos', x: 'Lunes: producto de la semana con precio y llamado a la acción.\nJueves: video corto del proceso, del equipo o de un cliente contento.\nCada día: una historia (oferta, horario o pedido listo).', f: flojo('D3.1') || flojo('D3.2') });
    var sel = L.filter(function (x) { return x.f; }); if (sel.length < 4) sel = sel.concat(L.filter(function (x) { return !x.f; }));
    return sel.slice(0, 6);
  }
  function vKit(id) {
    var db = leer(), ev = buscar(id); if (!ev) return vPanel();
    var p = puntajes(ev.resp), nv = nivelDe(p.indice), g = ev.google, wa = ev.links && ev.links.whatsapp ? numWA(ev.links.whatsapp) : '';
    var resena = g && g.id ? 'https://search.google.com/local/writereview?placeid=' + g.id : (ev.links && ev.links.maps) || '';
    var tieneFicha = !!(g || ((ev.datos || {}).ficha || []).indexOf('Tiene ficha') >= 0 || ev.resp['D2.1'] > 0);
    var qrs = [
      { t: 'Tu diagnóstico en tu celular', d: 'Escanea con la cámara: se abre WhatsApp con tu resultado' + (recomendaciones(ev.resp).length ? ' y las primeras acciones' : '') + '. Envíatelo a ti mismo para guardarlo.', u: 'https://wa.me/?text=' + encodeURIComponent(textoResumen(ev)) },
      resena ? { t: 'Pide reseñas en Google', d: g && g.id ? 'Imprime este QR y ponlo en tu caja o en tu mesa: lleva al cliente directo a dejar su reseña.' : 'Lleva a tu ficha de Google Maps, donde el cliente puede dejar su reseña.', u: resena }
        : tieneFicha ? { t: 'Tu negocio en Google Maps', d: 'Lleva a la búsqueda de ' + ev.nombre + ' en Google Maps. Para un QR directo a las reseñas, en tu perfil de Google Business toca «Pedir reseñas».', u: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ev.nombre + ' Cobija') }
        : { t: 'Crea tu ficha de Google', d: 'No encontramos tu negocio en Google Maps. Escanea para crear tu ficha gratis con Google Business Profile.', u: 'https://www.google.com/business/' },
      wa ? { t: 'Recibe pedidos por WhatsApp', d: 'Ponlo en tu local, tus afiches y tus publicaciones: el cliente te escribe con un mensaje listo.', u: 'https://wa.me/' + wa + '?text=' + encodeURIComponent('Hola, ' + ev.nombre + '. Quiero hacer un pedido.') }
        : { t: 'Activa WhatsApp Business', d: 'Gratis: catálogo, mensaje de bienvenida y respuestas rápidas para vender por mensaje.', u: 'https://www.whatsapp.com/business' }];
    var T = RD ? RD.kit(ev, contexto(ev)) : plantillas(ev);
    var h = cab('') + '<main><div class="informe kit"><div class="tarjeta"><div class="inf-cab"><div class="inf-marca">' + avatarHTML(ev) + '<div><span class="eyebrow">Kit de mejora digital</span>' + etiquetaDemo(ev) + '<h1>' + esc(ev.nombre) + '</h1><div class="sub" style="margin:0">Índice ' + f0(p.indice) + ' de 100 · Nivel ' + nv.n.nombre + ' · ' + fecha(ev.fecha) + '</div></div></div>' +
      '<div class="meta"><img class="logo-imp" src="marki-logo.png" alt="Marki">Herramientas listas para usar hoy.<br>Escanea los códigos con la cámara del celular.</div></div>' +
      '<div class="qrs">' + qrs.map(function (q) { return '<div class="qr-c">' + qrSVG(q.u, 190) + '<b>' + esc(q.t) + '</b><small>' + esc(q.d) + '</small></div>'; }).join('') + '</div></div>' +
      '<div class="tarjeta bloque"><h3>Textos listos para copiar</h3><p class="sub">Escritos con los datos de ' + esc(ev.nombre) + ' y ordenados según lo que más le conviene mejorar. Revisa y cambia lo que está entre corchetes.</p><div class="plant">' +
      T.map(function (x, i) { return '<div class="pl"><div class="pl-cab"><b>' + esc(x.t) + '</b><button class="btn sec chico no-imp" data-copiar="' + i + '">Copiar</button></div><small>' + esc(x.p) + '</small><pre>' + esc(x.x) + '</pre></div>'; }).join('') + '</div></div>' +
      '<div class="pie-inf">Kit elaborado con Marki a partir del diagnóstico del ' + fecha(ev.fecha) + '. Universidad Amazónica de Pando · Carrera de Ingeniería Comercial · Marketing Digital (ICOM261).</div>' +
      '<div class="acciones no-imp"><button class="btn sec" id="volver">← Diagnóstico</button><span class="espacio"></span><button class="btn sec" id="env">Enviar al dueño</button><button class="btn sec" id="img">Imagen para redes</button><button class="btn sec" id="imp">Imprimir el kit</button><button class="btn pri" data-ir="nueva">Evaluar otra marca</button></div></div></main>';
    app.innerHTML = h; enlazar();
    $('#volver').onclick = function () { ir('informe', id); }; $('#imp').onclick = function () { window.print(); }; $('#img').onclick = function () { imagenRedes(ev); }; $('#env').onclick = function () { vEnviar(ev); };
    $$('[data-copiar]').forEach(function (b) { b.onclick = function () { var t = T[+b.dataset.copiar].x;
      var hecho = function () { b.textContent = '¡Copiado!'; setTimeout(function () { b.textContent = 'Copiar'; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(hecho, function () { aviso('Selecciona el texto y cópialo a mano.'); }); else aviso('Selecciona el texto y cópialo a mano.'); }; });
  }

  /* ================================================================ configuración */
  function vConfig() {
    var c = cfg();
    app.innerHTML = cab('') + '<main style="max-width:820px"><div class="tarjeta"><h1 style="font-size:32px">Configuración</h1><p class="sub">Se guarda solo en esta computadora. No se incluye en los respaldos.</p>' +
      '<h3>Búsqueda automática en Google Maps (opcional)</h3><p class="sub" style="margin-bottom:10px">Con una clave de Google Maps Platform, Marki busca el negocio y trae su ficha, reseñas, calificación, horario, teléfono y sitio web. Sin clave, todo funciona igual con la revisión manual.</p>' +
      '<label class="campo"><b>Clave de API de Google Maps</b><input type="text" id="gk" autocomplete="off" spellcheck="false" placeholder="AIza…" value="' + esc(c.googleKey || '') + '"></label>' +
      '<div class="acciones" style="margin-top:12px"><button class="btn pri" id="gguardar">Guardar</button><button class="btn sec" id="gprobar">Probar con «Plaza principal»</button><span class="espacio"></span><button class="btn peligro chico" id="gborrar">Quitar la clave</button></div><div id="gtest"></div>' +
      '<details class="enlaces" style="margin-top:20px"><summary>Cómo obtener la clave (10 minutos)</summary><ol class="pasos-cfg">' +
      '<li>Entra a <b>console.cloud.google.com</b> con tu cuenta de Google y crea un proyecto, por ejemplo «Marki UAP».</li>' +
      '<li>Activa la facturación del proyecto. Google pide una tarjeta, pero cada mes da un uso gratuito; para la Feria (decenas de búsquedas) no debería generar cobro. Revisa los precios vigentes en la página de Google Maps Platform.</li>' +
      '<li>En «APIs y servicios → Biblioteca», habilita <b>Maps JavaScript API</b> y <b>Places API (New)</b>.</li>' +
      '<li>En «Credenciales», crea una <b>clave de API</b>. En «Restricciones de API», limítala a esas dos API.</li>' +
      '<li>Pega la clave aquí, guarda y pulsa «Probar».</li></ol><p class="nota">Después de la Feria puedes borrar la clave o el proyecto desde la misma consola.</p></details></div>' +
      '<div class="tarjeta" id="hojaCfg"><h3 style="margin-top:0">Copia en Google Sheets (recomendado)</h3><p class="sub" style="margin-bottom:10px">Cada evaluación terminada se envía a una hoja de cálculo de tu Google Drive. Marki sigue guardando primero en este equipo, así que funciona igual de rápido y sin internet; lo que quede pendiente se sube solo cuando vuelve la conexión. Todos los evaluadores pueden enviar a la misma hoja.</p>' +
      '<label class="campo"><b>Dirección de la aplicación web (termina en /exec)</b><input type="url" id="hu" autocomplete="off" spellcheck="false" placeholder="https://script.google.com/macros/s/…/exec" value="' + esc(c.hojaUrl || '') + '"></label>' +
      '<label class="campo" style="margin-top:10px"><b>Clave compartida (opcional)</b><input type="text" id="hc" autocomplete="off" spellcheck="false" placeholder="La misma que escribas en el código" value="' + esc(c.hojaClave || '') + '"></label>' +
      '<label class="campo" style="margin-top:10px"><b>Clave de lectura (solo en el equipo del stand y en el del docente)</b><input type="text" id="hl" autocomplete="off" spellcheck="false" placeholder="La misma que CLAVE_LECTURA en el código" value="' + esc(c.hojaLectura || '') + '"><small class="nota">Con ella, este equipo trae cada minuto las evaluaciones y los expertos guardados desde otros equipos (por ejemplo, los celulares de los estudiantes). No la pongas en config.js ni en los celulares.</small></label>' +
      '<div class="acciones" style="margin-top:12px"><button class="btn pri" id="hguardar">Guardar y probar</button><button class="btn sec" id="htodas">Subir todas las evaluaciones guardadas</button><button class="btn sec" id="hbajar">Traer ahora lo de otros equipos</button><span class="espacio"></span><button class="btn peligro chico" id="hquitar">Desconectar</button></div><div id="htest"></div><p data-hoja-est>' + textoEstadoHoja() + '</p>' +
      '<details class="enlaces" style="margin-top:14px"><summary>Cómo conectar la hoja (5 minutos)</summary><ol class="pasos-cfg">' +
      '<li>En Google Drive crea una hoja de cálculo nueva, por ejemplo «Marki - Evaluaciones».</li>' +
      '<li>En la hoja, abre <b>Extensiones → Apps Script</b>. Borra lo que aparece y pega el código de abajo (también está en la carpeta de Marki: <b>apps_script/Codigo.gs</b>). Guarda con el icono del disco.</li>' +
      '<li>Si quieres una clave, escríbela entre las comillas de <code>var CLAVE = \'\';</code> y escribe la misma en el campo de arriba. Para que el televisor del stand muestre lo que evalúan los celulares, escribe también una clave distinta en <code>var CLAVE_LECTURA = \'\';</code> y ponla solo en el equipo del stand y en el del docente.</li>' +
      '<li>Pulsa <b>Implementar → Nueva implementación</b>, elige el tipo <b>Aplicación web</b>. En «Ejecutar como» elige <b>Yo</b> y en «Quién tiene acceso» elige <b>Cualquier persona</b>. Pulsa Implementar.</li>' +
      '<li>Google pide permisos. Como el script es tuyo y no está publicado, muestra «Google no verificó esta app»: pulsa <b>Configuración avanzada → Ir a (nombre del proyecto)</b> y permite.</li>' +
      '<li>Copia la dirección de la aplicación web, pégala arriba y pulsa «Guardar y probar». Para que los estudiantes envíen a la misma hoja, configura la misma dirección en cada equipo, o escríbela una sola vez en config.js si publicas Marki en internet.</li></ol>' +
      '<p class="nota">Si después cambias el código, usa <b>Implementar → Gestionar implementaciones → Editar → Versión nueva</b>; así la dirección no cambia. La hoja recibe las mismas columnas que el archivo CSV de Resultados, más la columna «registro_marki», que no debes editar: es la evaluación completa, la que usa el equipo del stand para mostrarla. Una evaluación corregida reemplaza su fila, y una evaluación borrada en Marki también se borra de la hoja.</p>' +
      '<div class="acciones" style="margin:8px 0"><button class="btn sec chico" id="hcopiar">Copiar el código</button></div><textarea id="hcod" readonly rows="10" class="codigo-gs"></textarea></details></div></main>';
    enlazar();
    $('#hcod').value = window.MARKI_GS || '';
    $('#hcopiar').onclick = function () { var t = $('#hcod'); t.select();
      (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t.value) : Promise.reject()).then(function () { aviso('Código copiado. Pégalo en Apps Script.', 'okk'); })
        .catch(function () { try { document.execCommand('copy'); aviso('Código copiado. Pégalo en Apps Script.', 'okk'); } catch (e) { aviso('Selecciona el texto y cópialo con Ctrl+C.'); } }); };
    function probarHoja() { var u = hojaUrl(); if (!u) { $('#htest').innerHTML = '<p class="g-nada">La dirección debe empezar con https://script.google.com/</p>'; return Promise.reject(); }
      $('#htest').innerHTML = '<p class="nota">Probando la conexión…</p>';
      return jsonp(u, { accion: 'ping', clave: cfg().hojaClave || '' }).then(function (r) {
        if (!r || !r.ok) throw new Error(r && r.error || 'respuesta inválida');
        $('#htest').innerHTML = '<p class="g-ok">✓ Conectado. La hoja tiene ' + r.filas + ' evaluación(es).' + (r.hoja ? ' <a href="' + esc(r.hoja) + '" target="_blank" rel="noopener">Abrir la hoja</a>' : '') + '</p>';
        var x = cfg(); x.hojaOk = true; x.hojaError = ''; guardarCfg(x); if (r.hoja && /^https:\/\/docs\.google\.com\//.test(r.hoja)) enlaceHoja(r.hoja); }).catch(function (e) { if (e) $('#htest').innerHTML = '<p class="g-nada">No funcionó: ' + esc(String(e && e.message || e)) + '</p>'; throw e; }); }
    $('#hbajar').onclick = function () { var x = cfg(); x.hojaLectura = $('#hl').value.trim(); guardarCfg(x);
      if (!hojaUrl()) { aviso('Primero guarda la dirección de la hoja.'); return; } if (!x.hojaLectura) { aviso('Escribe la clave de lectura.'); return; }
      aviso('Trayendo los datos de la hoja…'); bajar().then(function (n) { var e = estadoHoja(); aviso(e.errorLectura ? 'No se pudo: ' + e.errorLectura : n ? 'Listo: llegaron datos nuevos de otros equipos.' : 'Listo: no hay nada nuevo.', e.errorLectura ? 'err' : 'okk'); }); };
    $('#hguardar').onclick = function () { var x = cfg(); x.hojaUrl = $('#hu').value.trim(); x.hojaClave = $('#hc').value.trim(); x.hojaLectura = $('#hl').value.trim();
      /* lo escrito a mano manda: solo sigue a config.js si es la misma hoja */
      var b0 = window.MARKI_CONFIG || {}; if (x.hojaUrl !== String(b0.hojaUrl || '').trim() || x.hojaClave !== String(b0.hojaClave || '').trim()) delete x.hojaDesdeConfig; else x.hojaDesdeConfig = true; guardarCfg(x);
      if (!x.hojaUrl) { aviso('Sin dirección: las evaluaciones se guardan solo en este equipo.'); pintarEstadoHoja(); return; }
      probarHoja().then(function () { return subir(); }).then(function () { return bajar(); }).catch(function () {}); };
    $('#htodas').onclick = function () { if (!hojaUrl()) { aviso('Primero guarda la dirección de la hoja.'); return; }
      var db = leer(), ids = db.evals.map(function (e) { return e.id; }).filter(function (id) { return IDS_PRUEBA.indexOf(id) < 0; });
      if (!ids.length) { aviso('No hay evaluaciones guardadas para subir.'); return; }
      encolar(ids); pintarEstadoHoja(); aviso('Subiendo ' + ids.length + ' evaluación(es)…');
      subir().then(function (e) { aviso(e.pendientes ? 'Quedan ' + e.pendientes + ' pendientes: ' + (e.error || 'sin conexión') : 'Listo: todas están en la hoja.', e.pendientes ? 'err' : 'okk'); }); };
    $('#hquitar').onclick = function () { var x = cfg(); x.hojaUrl = ''; x.hojaClave = ''; delete x.hojaLectura; delete x.hojaOk; delete x.hojaDesdeConfig; delete x.hojaEnlace; guardarCfg(x); /* '' y no «borrar»: así config.js no la vuelve a conectar */
      guardarLista(CLAVE_COLA, []); guardarLista(CLAVE_COLA_BORRAR, []); $('#hu').value = ''; $('#hc').value = ''; $('#hl').value = ''; $('#htest').innerHTML = ''; pintarEstadoHoja(); aviso('Hoja desconectada. Las evaluaciones siguen guardadas en este equipo.'); };
    $('#gguardar').onclick = function () { var x = cfg(); x.googleKey = $('#gk').value.trim(); x.googleOk = false; guardarCfg(x); cargarMaps.p = null; aviso(x.googleKey ? 'Clave guardada.' : 'Sin clave: se usará la revisión manual.', 'okk'); };
    $('#gborrar').onclick = function () { var x = cfg(); delete x.googleKey; guardarCfg(x); $('#gk').value = ''; aviso('Clave quitada.'); };
    $('#gprobar').onclick = function () { var x = cfg(); x.googleKey = $('#gk').value.trim(); guardarCfg(x); if (!x.googleKey) { aviso('Pega primero la clave.'); return; }
      $('#gtest').innerHTML = '<p class="nota">Probando…</p>';
      consultarGoogle('Plaza principal Cobija Pando').then(function (l) { var y = cfg(); y.googleOk = true; guardarCfg(y); $('#gtest').innerHTML = '<p class="g-ok">✓ Funciona. Google devolvió ' + l.length + ' resultado(s)' + (l[0] ? ': ' + esc(l[0].displayName) : '') + '.</p>'; })
        .catch(function (e) { $('#gtest').innerHTML = '<p class="g-nada">No funcionó: ' + esc(String(e && e.message || e).slice(0, 220)) + '</p>'; }); };
  }

  /* ================================================================ v4: embudo del cliente, metas medibles, imagen para redes, demostración */
  var ETAPAS = [['Te encuentran', ['D2'], 'Google y asistentes de IA'], ['Te reconocen', ['D1'], 'Logotipo, colores y nombre'], ['Confían en ti', ['D3', 'D5'], 'Contenido y reseñas'],
    ['Te contactan', ['D4'], 'Comentarios y mensajes'], ['Te compran', ['D6'], 'Precios y formas de compra']];
  function embudo(p) {
    var E2 = ETAPAS.map(function (e) { var v = e[1].map(function (d) { return p.dims[d]; }).filter(function (x) { return x != null; }); return { n: e[0], d: e[2], v: v.length ? media(v) : null }; });
    var conV = E2.filter(function (x) { return x.v != null; }).sort(function (a, b) { return a.v - b.v; }), min = conV.length > 1 && conV[0].v < conV[conV.length - 1].v ? conV[0] : null; /* sin diferencias no hay etapa «peor» */
    return '<div class="tarjeta bloque embudo"><h3>El recorrido de tu cliente</h3><p class="sub">Así avanza una persona desde que busca hasta que compra. Cada etapa usa los puntajes de las dimensiones de Marki.</p><div class="emb">' +
      E2.map(function (x, i) { var nv = x.v == null ? null : nivelDe(x.v); return '<div class="emb-e' + (x === min ? ' peor' : '') + '" style="--c:' + (nv ? COL_T[nv.k] : '#B9C2D3') + '"><i>' + (i + 1) + '</i><b>' + esc(x.n) + '</b><small>' + esc(x.d) + '</small><em>' + f0(x.v) + '</em>' + (x === min ? '<span>Aquí se pierden más clientes</span>' : '') + '</div>'; }).join('') +
      '</div><p class="nota" style="margin:10px 0 0">Publicidad y medición: <b>' + f0(p.dims.D7) + '</b>. Los anuncios atraen clientes a todo el recorrido y la medición dice qué funciona.</p></div>';
  }
  /* Metas a 30 días: los umbrales del nivel 2 de la rúbrica, aplicados a los datos observados */
  function metas(ev) {
    var M = metasDatos(ev);
    if (!M.length) return '';
    return '<div class="metas"><h4>Metas medibles para los próximos 30 días</h4><table><thead><tr><th>Indicador</th><th>Hoy</th><th>Meta</th></tr></thead><tbody>' +
      M.map(function (m) { return '<tr><td>' + esc(m[0]) + '</td><td>' + esc(String(m[1])) + '</td><td><b>' + esc(m[2]) + '</b></td></tr>'; }).join('') + '</tbody></table><small>La meta es el criterio del nivel más alto de la rúbrica de Marki.</small></div>';
  }
  /* logos ya cargados para dibujarlos en la imagen para redes (vienen en datos: funcionan sin internet) */
  var IMG_LOGO = {}; if (window.MARKI_LOGOS) ['blanco', 'color', 'icono'].forEach(function (k) { var im = new Image(); im.src = window.MARKI_LOGOS[k]; IMG_LOGO[k] = im; });
  function etiquetaDemo(ev) { return ev.origen === 'Demo' ? '<span class="pill-demo">Ejemplo ficticio para demostración</span>' : ''; }

  /* Imagen 1080 × 1350 para publicar en Facebook o Instagram: muestra el punto de partida y la meta, no solo la nota */
  function imagenRedes(ev) {
    var p = puntajes(ev.resp), nv = nivelDe(p.indice), recs = recomendaciones(ev.resp).slice(0, 3), proy = recs.length ? proyectar(ev.resp, recs.map(function (r) { return r.it.id; })).indice : null;
    var W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'), F = 'Inter, "Segoe UI", Roboto, Arial, sans-serif';
    var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0A1226'); g.addColorStop(.55, '#12245A'); g.addColorStop(1, '#1C3C86'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var rg = x.createRadialGradient(900, 120, 10, 900, 120, 620); rg.addColorStop(0, 'rgba(80,130,255,.35)'); rg.addColorStop(1, 'rgba(80,130,255,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, H);
    function rr(X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
    /* logo */
    var LI = IMG_LOGO.blanco, lw = 100 * ((window.MARKI_LOGOS || {}).proporcion || 2.23);
    if (LI && LI.complete && LI.naturalWidth) { x.drawImage(LI, 80, 72, lw, 100); x.fillStyle = 'rgba(255,255,255,.3)'; x.fillRect(80 + lw + 26, 92, 2, 64); x.fillStyle = '#C9D6F2'; x.font = '500 30px ' + F; x.fillText('Diagnóstico de', 80 + lw + 52, 118); x.fillText('presencia digital', 80 + lw + 52, 154); }
    else { x.fillStyle = '#fff'; x.font = '800 48px ' + F; x.fillText('MARKI', 80, 128); x.fillStyle = '#9FB3D9'; x.font = '500 30px ' + F; x.fillText('Diagnóstico de presencia digital', 80, 166); }
    /* nombre */
    x.fillStyle = '#fff'; x.font = '800 78px ' + F; var pal = ev.nombre.split(' '), lin = [], l = '';
    pal.forEach(function (w) { var t = l ? l + ' ' + w : w; if (x.measureText(t).width > W - 160 && l) { lin.push(l); l = w; } else l = t; }); lin.push(l); lin = lin.slice(0, 2);
    lin.forEach(function (t, i) { x.fillText(t, 80, 320 + i * 88); });
    var yb = 320 + (lin.length - 1) * 88; x.fillStyle = '#C9D6F2'; x.font = '500 32px ' + F; x.fillText(rubroTexto(ev) + ' · Cobija, Pando', 80, yb + 58);
    /* anillo */
    var cx = 540, cy = yb + 380, R2 = 215; x.lineWidth = 44; x.lineCap = 'round';
    x.strokeStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.arc(cx, cy, R2, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = COL[nv.k]; x.beginPath(); x.arc(cx, cy, R2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(.01, (p.indice || 0) / 100)); x.stroke();
    x.textAlign = 'center'; x.fillStyle = '#fff'; x.font = '800 170px ' + F; x.fillText(f0(p.indice), cx, cy + 50); x.fillStyle = '#9FB3D9'; x.font = '600 34px ' + F; x.fillText('de 100', cx, cy + 104);
    /* nivel */
    x.font = '750 40px ' + F; var tn = 'Nivel ' + nv.n.nombre, wn = x.measureText(tn).width + 70; rr(cx - wn / 2, cy + R2 + 50, wn, 74, 37); x.fillStyle = '#fff'; x.fill(); x.fillStyle = COL[nv.k]; x.fillText(tn, cx, cy + R2 + 100);
    if (proy != null && proy > p.indice) { x.fillStyle = '#fff'; x.font = '600 40px ' + F; x.fillText('Mi meta en 30 días: ' + f0(proy) + ' puntos', cx, cy + R2 + 200); }
    x.fillStyle = '#9FB3D9'; x.font = '500 27px ' + F; x.fillText('Feria FEXCOIN UAP 2026 · Ingeniería Comercial · Marketing Digital', cx, H - 72);
    if (ev.origen === 'Demo') { x.save(); x.translate(cx, H / 2); x.rotate(-.5); x.fillStyle = 'rgba(255,255,255,.08)'; x.font = '900 190px ' + F; x.fillText('EJEMPLO', 0, 0); x.restore(); }
    c.toBlob(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'Marki_' + slug(ev.nombre) + '.png'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }, 'image/png');
    aviso('Imagen descargada. Publícala en Facebook o Instagram y etiqueta a la UAP.', 'okk');
  }

  /* Demostración para el jurado: negocios ficticios, guardados aparte y nunca en las estadísticas */
  var PERFILES_DEMO = [
    { n: 'Pastelería Ejemplo', r: 'Cafetería, heladería o panadería', seg: 1850, est: 70, v: [2, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0],
      datos: { ficha: ['Tiene ficha', 'Categoría', 'Ubicación exacta'], posts30: 5, formatos: ['Foto o afiche', 'Video corto'], respuesta_min: 180, resenas: 8, calificacion: 4.3 } },
    { n: 'Pollería Ejemplo', r: 'Restaurante o comida', seg: 6400, est: 85, v: [2, 2, 2, 2, 1, 1, 2, 2, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 0, 1],
      datos: { ficha: ['Tiene ficha', 'Categoría', 'Horario', 'Teléfono', 'Ubicación exacta', 'Fotos'], posts30: 10, formatos: ['Foto o afiche', 'Video corto', 'Historias destacadas'], respuesta_min: 25, resenas: 46, calificacion: 4.6 } }];
  function crearDemo() {
    var k = 0; try { k = (+localStorage.getItem('marki_demo_k') || 0) + 1; localStorage.setItem('marki_demo_k', k); } catch (e) {} var x = PERFILES_DEMO[k % PERFILES_DEMO.length];
    var ev = { id: 'demo-' + uid(), fecha: new Date().toISOString(), nombre: x.n, codigo: 'demo', rubro: x.r, red: 'Facebook', evaluador: '', origen: 'Demo', consentimiento: null, seguidores: x.seg,
      links: {}, datos: x.datos, resp: {}, auto: {}, notas: {}, version: R.version, estimacion: x.est, google: null, minutos: null };
    ITEMS.forEach(function (it, i) { ev.resp[it.id] = x.v[i]; if (it.auto) ev.auto[it.id] = true; });
    try { localStorage.setItem(DEMO, JSON.stringify([ev])); } catch (e) {}
    vRevelar(ev.id);
  }

  /* ================================================================ preparar la Feria: revisión antes de abrir el stand */
  var CHECK_MANUAL = [
    ['eval', 'Hacer una evaluación completa de prueba en esta misma laptop', 'Del nombre al kit, con la revelación del resultado. Luego bórrala desde Resultados.'],
    ['qr', 'Escanear los 3 códigos QR del kit con un celular', 'Comprueba que abren WhatsApp y Google Maps.'],
    ['img', 'Descargar una imagen para redes y abrirla', 'Para mostrar cómo queda la publicación.'],
    ['luz', 'Cargador, extensión eléctrica y cable HDMI para el televisor', 'La pantalla del stand va en el televisor; la evaluación, en la laptop.'],
    ['red', 'Internet estable o datos móviles de respaldo', 'Sin internet no se pueden revisar las redes ni Google Maps.'],
    ['imp', 'Llevar 2 diagnósticos y 1 kit impresos de ejemplo', 'Para mostrar el producto aunque no haya visitantes en ese momento.'],
    ['roles', 'Repartir roles: recepción, evaluador y quien presenta el resultado', 'Así la fila avanza y nadie espera sin atención.'],
    ['guion', 'Ensayar el guion de 2 minutos con cada estudiante', 'El jurado puede preguntarle a cualquiera del equipo.'],
    ['cons', 'Explicar la autorización antes de cada diagnóstico', 'Los resultados se usan de forma anónima y agrupada.']];
  function vPreparar() {
    var db = leer(), c = cfg(), hechos = c.check || {}, prueba = dePrueba(db).length, guarda = true;
    try { localStorage.setItem('marki_t', '1'); localStorage.removeItem('marki_t'); } catch (e) { guarda = false; }
    var sinR = sinRespaldo(db), reales = db.evals.length - prueba;
    var auto = [
      [!prueba, prueba ? 'Hay ' + pl(prueba, 'evaluación', 'evaluaciones') + ' de prueba ' + (prueba === 1 ? 'cargada' : 'cargadas') : 'Sin datos de prueba', prueba ? 'Bórralas para que el televisor y los resultados muestren solo negocios reales.' : 'Los resultados y el televisor mostrarán solo negocios reales.', prueba ? '<button class="btn peligro chico" data-borrar-prueba>Borrar datos de prueba</button>' : ''],
      [guarda, guarda ? 'Este navegador guarda los datos' : 'Este navegador NO guarda los datos', guarda ? 'No uses una ventana de incógnito durante la Feria: al cerrarla se borra todo.' : 'Sal del modo incógnito o usa otro navegador (Chrome o Edge).', ''],
      [sinR < 3, reales ? (sinR ? sinR + (sinR === 1 ? ' evaluación sin respaldo' : ' evaluaciones sin respaldo') : 'Respaldo al día') : 'Todavía no hay evaluaciones reales', 'Descarga un respaldo cada 5 diagnósticos y guárdalo en una memoria USB o en tu correo.', reales ? '<button class="btn sec chico" data-respaldo>Descargar respaldo</button>' : ''],
      [!!c.hojaUrl, c.hojaUrl ? (c.hojaOk ? 'Copia en Google Sheets conectada' : 'Dirección de Google Sheets guardada, sin probar') : 'Sin copia en Google Sheets: los datos quedan solo en este equipo', c.hojaUrl ? 'Haz una evaluación de prueba y revisa que llegue a la hoja.' : 'Conéctala en Configuración o descarga un respaldo al final de cada jornada.', '<button class="btn sec chico" data-ir="config">Configuración</button>'],
      [!!c.hojaLectura || !c.hojaUrl, c.hojaLectura ? 'Este equipo trae lo evaluado en otros equipos (clave de lectura)' : 'Este equipo muestra solo lo evaluado en él', c.hojaLectura ? (c.hojaErrorLectura ? 'Último intento: ' + c.hojaErrorLectura : 'El televisor y Resultados incluyen lo que suben los celulares.') : 'Si este es el equipo del televisor y los estudiantes evalúan con sus celulares, escribe la clave de lectura en Configuración.', '<button class="btn sec chico" data-ir="config">Configuración</button>'],
      [true, c.googleKey ? (c.googleOk ? 'Búsqueda en Google Maps probada' : 'Clave de Google guardada, sin probar') : 'Búsqueda en Google Maps desactivada (opcional)', c.googleKey ? 'Pruébala con internet del lugar antes de abrir el stand.' : 'Funciona igual con la revisión manual.', '<button class="btn sec chico" data-ir="config">Configuración</button>']];
    var nAuto = auto.filter(function (a) { return a[0]; }).length, nMan = CHECK_MANUAL.filter(function (m) { return hechos[m[0]]; }).length, tot = auto.length + CHECK_MANUAL.length, listo = nAuto + nMan;
    app.innerHTML = cab('') + '<main style="max-width:900px"><div class="tarjeta"><span class="eyebrow">Antes de abrir el stand</span><h1 style="font-size:34px">Preparar la Feria</h1>' +
      '<div class="prep-bar"><div><i style="width:' + Math.round(listo / tot * 100) + '%"></i></div><b>' + listo + ' de ' + tot + ' listos</b></div>' +
      '<h3>Revisión automática</h3><div class="prep">' + auto.map(function (a) { return '<div class="prep-i ' + (a[0] ? 'si' : 'no') + '"><span class="prep-e">' + (a[0] ? '✓' : '!') + '</span><div><b>' + esc(a[1]) + '</b><small>' + esc(a[2]) + '</small></div>' + a[3] + '</div>'; }).join('') + '</div>' +
      '<h3>Lista del equipo</h3><div class="prep">' + CHECK_MANUAL.map(function (m) { return '<label class="prep-i ' + (hechos[m[0]] ? 'si' : '') + '"><input type="checkbox" data-chk="' + m[0] + '"' + (hechos[m[0]] ? ' checked' : '') + '><div><b>' + esc(m[1]) + '</b><small>' + esc(m[2]) + '</small></div></label>'; }).join('') + '</div>' +
      '<div class="acciones"><button class="btn sec" id="pstand">Abrir la pantalla del stand en otra ventana</button><button class="btn sec" id="pdemo">Probar la demostración</button><span class="espacio"></span><button class="btn pri" data-ir="nueva">Empezar a evaluar</button></div>' +
      '<p class="nota">Para el televisor: abre la pantalla del stand en otra ventana, arrástrala al televisor y pulsa «Pantalla completa». Se actualiza sola cuando se guarda un diagnóstico en la laptop.</p></div></main>';
    enlazar(); enlazarRespaldo(); enlazarPrueba(vPreparar);
    $$('[data-respaldo]').forEach(function (b) { var f = b.onclick; b.onclick = function () { f(); setTimeout(vPreparar, 300); }; });
    $$('[data-chk]').forEach(function (k) { k.onchange = function () { var x = cfg(); x.check = x.check || {}; x.check[k.dataset.chk] = k.checked; guardarCfg(x); vPreparar(); }; });
    $('#pstand').onclick = function () { window.open(location.pathname + '#stand', 'marki_stand', 'width=1280,height=760'); };
    $('#pdemo').onclick = crearDemo;
  }

  /* ================================================================ diagnóstico en PDF y envío al dueño */
  function metasDatos(ev) {
    var d = ev.datos || {}, r = ev.resp, M = [];
    var bajo = function (id) { return r[id] === 0 || r[id] === 1; };
    if (bajo('D2.1') && d.ficha) M.push(['Ficha de Google completa', d.ficha.indexOf('Tiene ficha') < 0 ? 'No tiene' : (d.ficha.length - 1) + ' de 5 datos', '5 de 5 datos']);
    if (bajo('D3.1') && d.posts30 != null) M.push(['Publicaciones al mes', String(d.posts30), '8 o más']);
    if (bajo('D3.2') && d.formatos) M.push(['Formatos distintos', String(d.formatos.length), '3 o más']);
    if (bajo('D4.3')) M.push(['Tiempo de respuesta a un mensaje', d.respuesta_min == null || d.respuesta_min === 'sin' ? 'Sin respuesta' : tiempoCorto(d.respuesta_min), 'Menos de 1 hora']);
    if (bajo('D5.1') && d.resenas != null) M.push(['Reseñas en Google', String(d.resenas), '20 o más (' + (20 - d.resenas) + (20 - d.resenas === 1 ? ' nueva)' : ' nuevas)')]);
    if (bajo('D5.2') && d.calificacion != null) { var k5 = RD ? RD.faltan5(d.calificacion, d.resenas, 4.5) : 0; M.push(['Calificación en Google', f1(d.calificacion), '4,5 o más' + (k5 && k5 <= 30 ? ' (' + k5 + (k5 === 1 ? ' reseña de 5 estrellas)' : ' reseñas de 5 estrellas)') : '')]); }
    return M;
  }
  function pdfDiagnostico(ev) {
    var J = window.jspdf && window.jspdf.jsPDF; if (!J) throw new Error('No se encontró la librería jsPDF (lib/jspdf.umd.min.js).');
    var db = leer(), otros = unaPorNegocio(estudio(db, ev.id)).filter(function (e) { return e.codigo !== ev.codigo; }), ref = referencia(otros);
    var p = puntajes(ev.resp), nv = nivelDe(p.indice), recs = recomendaciones(ev.resp, ev), fort = fortalezas(ev.resp), top3 = recs.slice(0, 3), resto = recs.slice(3);
    var proy = top3.length ? proyectar(ev.resp, top3.map(function (r) { return r.it.id; })) : null;
    var doc = new J({ unit: 'mm', format: 'a4' }), W = 210, M = 14, y = 0, AZ = '#1F3864', RO = '#8B0000', GR = '#566074', LN = '#DCE1E9';
    /* Helvetica del PDF no tiene «·»: se reemplaza por un guion */
    var limpia = function (t) { return String(t).replace(/\s*·\s*/g, ' - ').replace(/≠/g, 'distinto de').replace(/[^\x00-\xFF\u2018-\u201E\u2022\u2026\u2013\u2014\u20AC]/g, '').replace(/ {2,}/g, ' ').replace(/^ | $/gm, ''); };
    var T = function (t, x, yy, o) { doc.text(limpia(t), x, yy, o || {}); };
    var F = function (estilo, tam, color) { doc.setFont('helvetica', estilo); doc.setFontSize(tam); doc.setTextColor(color || '#141B2B'); };
    var envolver = function (t, ancho) { return doc.splitTextToSize(limpia(t), ancho); };
    function cabecera(pag) {
      doc.setFillColor(AZ); doc.rect(0, 0, W, 20, 'F'); doc.setFillColor(RO); doc.rect(0, 20, W, 1.3, 'F');
      var LG = window.MARKI_LOGOS; /* logo oficial en la franja azul */
      if (LG) { var lw = 11.5 * LG.proporcion; doc.addImage(LG.blanco, 'PNG', M, 4.2, lw, 11.5, 'marki-logo-blanco', 'FAST'); doc.setDrawColor('#5A6E9C'); doc.setLineWidth(.3); doc.line(M + lw + 3.5, 6, M + lw + 3.5, 14.5); F('normal', 8.5, '#C9D4E8'); T('Diagnóstico de presencia digital', M + lw + 7, 11.5); }
      else { F('bold', 15, '#FFFFFF'); T('MARKI', M, 10.5); F('normal', 8.5, '#C9D4E8'); T('Diagnóstico de presencia digital', M, 15.5); }
      F('normal', 8, '#C9D4E8'); T('Universidad Amazónica de Pando', W - M, 10, { align: 'right' }); T('Ingeniería Comercial · Marketing Digital (ICOM261)', W - M, 14.5, { align: 'right' });
      F('normal', 7.5, GR); T('Página ' + pag, W - M, 290, { align: 'right' });
      T('Marki mide lo que un cliente puede ver en internet; no mide ventas ni calidad del producto.', M, 290);
    }
    function titulo(t, yy) { F('bold', 11.5, AZ); T(t, M, yy); doc.setDrawColor(LN); doc.setLineWidth(.3); doc.line(M, yy + 1.8, W - M, yy + 1.8); return yy + 7; }
    function nueva() { doc.addPage(); cabecera(doc.getNumberOfPages()); return 30; }
    function falta(alto) { if (y + alto > 280) y = nueva(); }

    /* ---------------- hoja 1 */
    cabecera(1); y = 32;
    if (ev.origen === 'Demo') { F('bold', 8, '#8A5A00'); T('EJEMPLO FICTICIO PARA DEMOSTRACIÓN', M, 27); }
    /* foto del lugar junto al nombre (alto fijo de 24 mm; el ancho sigue la proporción de la foto) */
    var foto = fotoDe(ev), xN = M, fotoAbajo = 0;
    if (foto) { try { var fp0 = doc.getImageProperties(foto), fh = 24, fw = Math.min(36, Math.max(18, fh * fp0.width / fp0.height));
      doc.addImage(foto, /^data:image\/png/.test(foto) ? 'PNG' : 'JPEG', M, 25.5, fw, fh, 'foto-' + ev.id, 'FAST'); doc.setDrawColor(LN); doc.setLineWidth(.3); doc.rect(M, 25.5, fw, fh, 'S');
      xN = M + fw + 5; fotoAbajo = 25.5 + fh + 5; } catch (e) { xN = M; } }
    F('bold', 18); var nom = envolver(ev.nombre, 125 - (xN - M)); doc.text(nom, xN, y); y += nom.length * 7;
    F('normal', 9.5, GR); var rub = envolver(rubroTexto(ev) + ' · Cobija, Pando', 125 - (xN - M)); doc.text(rub, xN, y); y += (rub.length - 1) * 4.5;
    F('normal', 8.5, GR); var meta = ['Fecha: ' + fecha(ev.fecha)].concat(['Indicadores evaluados: ' + p.evaluados + ' de ' + ITEMS.length]);
    meta.forEach(function (m, i) { T(m, W - M, 30 + i * 4.5, { align: 'right' }); });
    y = Math.max(y + 10, fotoAbajo);
    /* anillo */
    var cx = M + 20, cy = y + 19, R0 = 17, pct = (p.indice || 0) / 100;
    doc.setLineWidth(5); doc.setDrawColor('#E6EAF0'); doc.circle(cx, cy, R0, 'S');
    doc.setDrawColor(COL[nv.k]); doc.setLineCap('round');
    var pasos = Math.max(2, Math.round(120 * pct)), a0 = -Math.PI / 2;
    for (var i = 0; i < pasos; i++) { var a1 = a0 + (2 * Math.PI * pct) * i / pasos, a2 = a0 + (2 * Math.PI * pct) * (i + 1) / pasos; doc.line(cx + R0 * Math.cos(a1), cy + R0 * Math.sin(a1), cx + R0 * Math.cos(a2), cy + R0 * Math.sin(a2)); }
    doc.setLineCap('butt'); F('bold', 22); T(f0(p.indice), cx, cy + 3, { align: 'center' }); F('normal', 7.5, GR); T('de 100 puntos', cx, cy + 8, { align: 'center' });
    var x2 = M + 46; doc.setFillColor(COL[nv.k]); doc.roundedRect(x2, y + 3, 38, 8, 2, 2, 'F'); F('bold', 10, '#FFFFFF'); T('Nivel ' + nv.n.nombre, x2 + 19, y + 8.4, { align: 'center' });
    F('normal', 10.5); var d1 = envolver(nv.n.texto, W - M - x2); doc.text(d1, x2, y + 17); var yy = y + 17 + d1.length * 4.8;
    if (ref) { F('normal', 8.5, GR); var d2 = envolver('El promedio de los ' + ref.n + ' negocios del estudio es ' + f0(ref.indice) + '. Esta marca supera al ' + Math.round(ref.indices.filter(function (x) { return x < p.indice; }).length / ref.indices.length * 100) + ' % de los negocios del estudio.', W - M - x2); doc.text(d2, x2, yy + 1); yy += d2.length * 4; }
    if (ev.estimacion != null) { F('bold', 9, AZ); var d3 = envolver('El dueño creía tener ' + ev.estimacion + ' puntos; su presencia digital real es ' + f0(p.indice) + '.', W - M - x2); doc.text(d3, x2, yy + 2); yy += d3.length * 4.2; }
    y = Math.max(y + 42, yy + 6);
    /* lo que Marki encontró */
    var LT = lecturaDe(ev);
    if (LT.length) { F('normal', 9.4); var lineas = [], anchoL = W - 2 * M - 10; LT.forEach(function (t, i) { F(i ? 'normal' : 'bold', 9.4); lineas.push({ b: !i, l: envolver(t, anchoL) }); });
      var alto = 9 + lineas.reduce(function (a, x) { return a + x.l.length * 4.2 + 1.4; }, 0);
      doc.setFillColor('#F2F6FC'); doc.roundedRect(M, y - 4, W - 2 * M, alto, 2, 2, 'F'); doc.setFillColor(AZ); doc.rect(M, y - 4, 1.6, alto, 'F');
      F('bold', 10.5, AZ); T('Lo que Marki encontró', M + 6, y + 1.5); var yl = y + 7.5;
      lineas.forEach(function (x) { F(x.b ? 'bold' : 'normal', 9.4, '#141B2B'); doc.text(x.l, M + 6, yl); yl += x.l.length * 4.2 + 1.4; });
      y += alto + 4; }
    /* dimensiones */
    y = titulo('Resultado por dimensión (de 0 a 100)', y);
    DIMS.slice().sort(function (a, b) { return (p.dims[b.id] || 0) - (p.dims[a.id] || 0); }).forEach(function (d) {
      var v = p.dims[d.id], bx = 70, bw = 105;
      F('normal', 9.5); T(d.nombre, M, y + 3);
      doc.setFillColor('#EDF0F5'); doc.roundedRect(bx, y, bw, 3.6, 1.5, 1.5, 'F');
      if (v != null && v > 0) { doc.setFillColor(COL[nivelDe(v).k]); doc.roundedRect(bx, y, Math.max(3, bw * v / 100), 3.6, 1.5, 1.5, 'F'); }
      if (ref && ref.dims[d.id] != null) { doc.setDrawColor('#141B2B'); doc.setLineWidth(.5); var mx = bx + bw * ref.dims[d.id] / 100; doc.line(mx, y - 1, mx, y + 4.6); }
      F('bold', 9.5); T(f0(v), W - M, y + 3, { align: 'right' }); y += 6.4;
    });
    if (ref) { F('normal', 7.5, GR); T('La raya negra marca el promedio de Cobija.', M, y + 1); y += 4; }
    y += 4;
    /* recorrido */
    y = titulo('El recorrido de tu cliente', y);
    var E2 = ETAPAS.map(function (e) { var v = e[1].map(function (d) { return p.dims[d]; }).filter(function (x) { return x != null; }); return { n: e[0], d: e[2], v: v.length ? media(v) : null }; });
    var conV2 = E2.filter(function (x) { return x.v != null; }).sort(function (a, b) { return a.v - b.v; }), peor = conV2.length > 1 && conV2[0].v < conV2[conV2.length - 1].v ? conV2[0] : null, bw2 = (W - 2 * M - 4 * 2) / 5;
    E2.forEach(function (e, i) {
      var bx = M + i * (bw2 + 2), c = e.v == null ? '#B9C2D3' : COL[nivelDe(e.v).k];
      doc.setDrawColor(e === peor ? '#E8A0A0' : LN); doc.setLineWidth(.35); doc.setFillColor(e === peor ? '#FFF6F6' : '#F7F9FC'); doc.roundedRect(bx, y, bw2, 24, 2, 2, 'FD');
      doc.setFillColor(c); doc.rect(bx, y, bw2, 1.6, 'F');
      F('normal', 7, GR); T((i + 1) + '', bx + 2.5, y + 6); F('bold', 8.6); doc.text(envolver(e.n, bw2 - 5), bx + 2.5, y + 10);
      F('bold', 15, c); T(f0(e.v), bx + 2.5, y + 20.5);
      if (e === peor) { F('bold', 6.4, '#B42318'); doc.text(envolver('Aquí se pierden más clientes', 18), bx + bw2 - 2, y + 17.5, { align: 'right' }); }
    });
    y += 30;
    /* datos observados */
    var obs = datosObservados(ev);
    if (obs.length) { falta(20); y = titulo('Datos observados', y); var col = (W - 2 * M) / 3;
      obs.forEach(function (o, i) { var cx2 = M + (i % 3) * col, cy2 = y + Math.floor(i / 3) * 10; F('normal', 7.6, GR); doc.text(envolver(o[0], col - 4), cx2, cy2); F('bold', 9.5); T(String(o[1]), cx2, cy2 + 4.6); });
      y += Math.ceil(obs.length / 3) * 10 + 2; }

    function altoFort() { var a = 9; fort.slice(0, 3).forEach(function (it) { F('normal', 8.8); a += envolver((RD && RD.evidencia(ev, it.id)) || punto(it.n[2]), W - 2 * M - 45).length * 3.9 + 1.6; }); return a; }
    function bloqueFort() {
      if (!fort.length) return; y = titulo('Lo que ya haces bien', y); var ancho = W - 2 * M;
      fort.slice(0, 3).forEach(function (it) { var e = (RD && RD.evidencia(ev, it.id)) || punto(it.n[2]); F('bold', 9); var a = limpia(it.nombre) + ': '; var wa = doc.getTextWidth(a);
        F('normal', 8.8, GR); var t = envolver(e, ancho - 5 - wa); falta(t.length * 3.9 + 1.5); doc.setFillColor('#0E9F6E'); doc.circle(M + 1.3, y - 1.1, .8, 'F');
        F('bold', 9, '#0B7A55'); doc.text(a, M + 4, y); F('normal', 8.8, GR); doc.text(t, M + 4 + wa, y); y += t.length * 3.9 + 1.6; }); y += 2;
    }
    /* códigos QR útiles para el negocio: van donde haya espacio, sin crear otra hoja */
    function bloqueQR() {
    var g = ev.google, wa = ev.links && ev.links.whatsapp ? numWA(ev.links.whatsapp) : '';
    var Q = []; if (g && g.id) Q.push(['Pide reseñas en Google', 'https://search.google.com/local/writereview?placeid=' + g.id]); else if (ev.links && ev.links.maps) Q.push(['Tu ficha de Google Maps', ev.links.maps]);
    if (wa) Q.push(['Pedidos por WhatsApp', 'https://wa.me/' + wa + '?text=' + encodeURIComponent('Hola, ' + ev.nombre + '. Quiero hacer un pedido.')]);
    if (!Q.length || !window.qrcode || y + 46 > 282) return false; { y = titulo('Códigos para imprimir en tu local', y);
      Q.forEach(function (q, i) { var qr = window.qrcode(0, 'M'); qr.addData(q[1]); qr.make(); var n = qr.getModuleCount(), lado = 30, s = lado / n, qx = M + i * 92;
        doc.setFillColor('#000000'); for (var r0 = 0; r0 < n; r0++) for (var c0 = 0; c0 < n; c0++) if (qr.isDark(r0, c0)) doc.rect(qx + c0 * s, y + r0 * s, s + .02, s + .02, 'F');
        F('bold', 9); doc.text(envolver(q[0], 50), qx + lado + 4, y + 8); F('normal', 7.8, GR); doc.text(envolver('Imprímelo y ponlo a la vista de tus clientes. Se escanea con la cámara del celular.', 50), qx + lado + 4, y + 14); });
      y += 36; }
      return true; }
    var fortHecho = false, qrHecho = false;
    if (fort.length && y + altoFort() <= 280) { bloqueFort(); fortHecho = true; }
    qrHecho = bloqueQR();
    /* ---------------- hoja 2 */
    y = nueva(); var ancho = W - 2 * M;
    y = titulo('Por dónde empezar', y);
    if (top3.length) top3.forEach(function (r, i) {
      F('bold', 9.8); var t = envolver(r.texto, ancho - 7); falta(t.length * 4.4 + 12);
      doc.setFillColor(AZ); doc.circle(M + 2.4, y - 1.3, 2.4, 'F'); F('bold', 8, '#FFFFFF'); T(String(i + 1), M + 2.4, y - .1, { align: 'center' });
      F('bold', 9.8); doc.text(t, M + 7, y); y += t.length * 4.4;
      if (r.visto) { F('italic', 8.6, '#6B5212'); var v = envolver('Lo que vimos: ' + r.visto, ancho - 7); doc.text(v, M + 7, y + .6); y += v.length * 3.9 + .6; }
      F('normal', 7.6, GR); T(r.it.nombre + ' · impacto ' + r.it.impacto + ' · esfuerzo ' + r.it.esfuerzo, M + 7, y + .8); y += 6.2; });
    else { F('normal', 9, GR); T('Todos los indicadores están en el nivel más alto.', M, y); y += 6; }
    if (proy) { var tp = envolver('Si cumples estas acciones, tu índice pasaría de ' + f0(p.indice) + ' a ' + f0(proy.indice) + ' (nivel ' + nivelDe(proy.indice).n.nombre + ').', ancho - 8); doc.setFillColor('#E8F6EF'); doc.roundedRect(M, y - 3.6, ancho, tp.length * 4.2 + 3.6, 2, 2, 'F'); F('bold', 9, '#0B6B4B'); doc.text(tp, M + 4, y + .4); y += tp.length * 4.2 + 4.5; }
    if (!fortHecho) bloqueFort();
    var MT = metasDatos(ev);
    if (MT.length) { falta(14 + MT.length * 6); y = titulo('Metas medibles para los próximos 30 días', y);
      F('bold', 8.2, GR); T('Indicador', M, y); T('Hoy', 105, y); T('Meta', 132, y); y += 4.5;
      MT.forEach(function (m) { doc.setDrawColor('#EBEEF3'); doc.line(M, y - 3.4, W - M, y - 3.4); F('normal', 9); T(m[0], M, y); T(m[1], 105, y); F('bold', 9, '#0B7A55'); T(m[2], 132, y); y += 5.4; });
      y += 3; }
    var PL = RD ? RD.plan(recs) : { semanas: [], despues: [] }, semanas = PL.semanas.slice(1);
    if (semanas.length) { falta(20); y = titulo('Plan de mejora: semanas 2 a 4', y);
      F('normal', 8, GR); T('La semana 1 es para las 3 acciones de «Por dónde empezar». Tres acciones por semana como máximo.', M, y); y += 5;
      semanas.forEach(function (s) { falta(12); F('bold', 9.4, AZ); T(s.t + ': ' + s.s.toLowerCase(), M, y); y += 4.8;
        s.recs.forEach(function (r) { F('normal', 8.6); var t = envolver(r.texto, ancho - 6); falta(t.length * 3.7 + 1.5); doc.setFillColor(AZ); doc.circle(M + 1.3, y - 1.1, .7, 'F'); doc.text(t, M + 5, y); y += t.length * 3.7 + 1; });
        y += 1.8; });
      if (PL.despues.length) { F('normal', 8.4, GR); var td = envolver('Después del primer mes: ' + PL.despues.map(function (r) { return minus(r.it.nombre); }).join(', ') + '.', ancho); falta(td.length * 3.8 + 2); doc.text(td, M, y); y += td.length * 3.8 + 2; } }
    if (!qrHecho) bloqueQR();
    if (y + 9 <= 284) { F('normal', 7.6, GR);
    doc.text(envolver('Diagnóstico elaborado con Marki (rúbrica v' + (ev.version || R.version) + ') a partir de la información pública de la marca observada el ' + fecha(ev.fecha) + '. Universidad Amazónica de Pando · Carrera de Ingeniería Comercial · Marketing Digital (ICOM261). Feria FEXCOIN UAP 2026.', W - 2 * M), M, y + 2); }
    return doc;
  }
  function nombrePDF(ev) { return 'Diagnostico_MARKI_' + slug(ev.nombre).replace(/[^a-z0-9-]/gi, '').slice(0, 40) + '.pdf'; }
  function bajarPDF(ev) { var doc = pdfDiagnostico(ev); doc.save(nombrePDF(ev)); return doc; }
  function mensajeDueno(ev, canal) {
    var p = puntajes(ev.resp), nv = nivelDe(p.indice), recs = recomendaciones(ev.resp, ev), top = recs.slice(0, 3);
    var L = lecturaDe(ev), sal = '\n\n';
    return 'Hola. Te escribimos del stand de Marketing Digital de la UAP (Ingeniería Comercial). Revisamos lo que un cliente ve de ' + ev.nombre + ' en internet: ' + f0(p.indice) + ' de 100, nivel ' + nv.n.nombre + '.' +
      (L.length ? sal + L.slice(0, 2).join(' ') : '') +
      (top.length ? sal + 'Por dónde empezar:\n' + top.map(function (r, i) { return (i + 1) + '. ' + r.texto; }).join('\n') : '') +
      sal + 'Te ' + (canal === 'correo' ? 'adjuntamos' : 'enviamos') + ' el PDF con el diagnóstico completo y tu plan de 30 días. ¡Gracias por visitarnos en la Feria FEXCOIN 2026!';
  }
  function vEnviar(ev) {
    var ov = document.createElement('div'); ov.className = 'modal-f'; var waIni = ev.links && ev.links.whatsapp ? ev.links.whatsapp : '';
    ov.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="envT"><h2 id="envT">Enviar el diagnóstico al dueño</h2>' +
      '<p class="sub">Se crea un PDF de 2 hojas con el resultado, el recorrido del cliente, las metas y el plan de 30 días.</p>' +
      '<div class="fila"><label class="campo"><b>WhatsApp del dueño</b><input type="tel" id="envWa" inputmode="tel" placeholder="7xxxxxxx" value="' + esc(waIni) + '"></label>' +
      '<label class="campo"><b>Correo del dueño</b><input type="email" id="envMail" placeholder="nombre@correo.com"></label></div>' +
      '<p class="nota" style="margin-top:6px">El número y el correo no se guardan en Marki: solo se usan para abrir el mensaje.</p>' +
      '<div class="env-b"><button class="btn pri" id="envShare" hidden>Compartir el PDF</button><button class="btn sec" id="envW">Enviar por WhatsApp</button><button class="btn sec" id="envM">Enviar por correo</button><button class="btn sec" id="envD">Solo descargar el PDF</button></div>' +
      '<div id="envAyuda"></div><div class="acciones" style="margin-top:14px"><span class="espacio"></span><button class="btn sec chico" id="envX">Cerrar</button></div></div>';
    document.body.appendChild(ov); var q = function (sel) { return ov.querySelector(sel); };
    var cerrar = function () { ov.remove(); document.removeEventListener('keydown', esc1); }, esc1 = function (e) { if (e.key === 'Escape') cerrar(); };
    document.addEventListener('keydown', esc1); ov.addEventListener('click', function (e) { if (e.target === ov) cerrar(); }); q('#envX').onclick = cerrar;
    var ayuda = function (h) { q('#envAyuda').innerHTML = '<div class="env-ayuda">' + h + '</div>'; };
    var archivo = null;
    try { var blob = pdfDiagnostico(ev).output('blob'); archivo = new File([blob], nombrePDF(ev), { type: 'application/pdf' }); } catch (e) { ayuda('No se pudo crear el PDF: ' + esc(String(e.message || e))); }
    if (archivo && navigator.canShare && navigator.canShare({ files: [archivo] })) {
      var bs = q('#envShare'); bs.hidden = false;
      bs.onclick = function () { navigator.share({ files: [archivo], title: 'Diagnóstico MARKI · ' + ev.nombre, text: mensajeDueno(ev, 'whatsapp') }).then(function () { aviso('Diagnóstico compartido.', 'okk'); }, function () {}); };
    }
    var bajar = function () { if (!archivo) return; var a = document.createElement('a'); a.href = URL.createObjectURL(archivo); a.download = archivo.name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000); };
    q('#envD').onclick = function () { bajar(); ayuda('Se descargó <b>' + esc(archivo.name) + '</b> en la carpeta de descargas.'); };
    q('#envW').onclick = function () {
      var n = numWA(q('#envWa').value); if (n.length < 10) { ayuda('Escribe un número de WhatsApp válido: 8 dígitos (por ejemplo 71234567) o con el código del país (591…).'); q('#envWa').focus(); return; }
      bajar(); window.open('https://wa.me/' + n + '?text=' + encodeURIComponent(mensajeDueno(ev, 'whatsapp')), '_blank');
      ayuda('<b>1.</b> Se descargó el PDF. <b>2.</b> Se abrió WhatsApp con el mensaje listo. <b>3.</b> En el chat, toca el clip 📎 o arrastra el PDF desde Descargas y envía. WhatsApp no permite adjuntar archivos de forma automática desde un enlace.');
    };
    q('#envM').onclick = function () {
      var m = q('#envMail').value.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) { ayuda('Escribe un correo válido, por ejemplo nombre@correo.com.'); q('#envMail').focus(); return; }
      bajar(); location.href = 'mailto:' + encodeURIComponent(m) + '?subject=' + encodeURIComponent('Diagnóstico de presencia digital · ' + ev.nombre) + '&body=' + encodeURIComponent(mensajeDueno(ev, 'correo'));
      ayuda('<b>1.</b> Se descargó el PDF. <b>2.</b> Se abrió tu programa de correo con el mensaje listo. <b>3.</b> Adjunta el PDF desde Descargas y envía. Si no se abrió ningún programa, copia el correo y envíalo desde Gmail en el navegador.');
    };
    setTimeout(function () { (waIni ? q('#envMail') : q('#envWa')).focus(); }, 50);
  }

  /* ================================================================ panel de resultados */
  function hipotesis(c, fr, sp, dimProm) {
    var bajo = DIMS.slice().sort(function (a, b) { return dimProm[a.id] - dimProm[b.id]; })[0];
    function est(cond, falta) { return falta ? ['pend', 'Faltan datos'] : cond ? ['si', 'Los datos la apoyan'] : ['no', 'Los datos no la apoyan']; }
    var h1 = est(c.icc != null && c.icc >= 0.75 && c.kw != null && c.kw > 0.6, c.icc == null || c.kw == null);
    var h2 = est(fr && fr.p < 0.05 && bajo.id === 'D7', !fr);
    var h3 = est(sp && sp.rho >= 0.3 && sp.p < 0.05, !sp);
    return '<div class="hips">' +
      '<div class="hip ' + h1[0] + '"><span>H1 · Confiabilidad</span><b>' + h1[1] + '</b><small>CCI(2,1) = ' + f2(c.icc) + ' (meta ≥ 0,75) · kappa ponderada = ' + f2(c.kw) + ' (meta > 0,60) · ' + c.pares + ' negocios con doble evaluación</small></div>' +
      '<div class="hip ' + h2[0] + '"><span>H2 · Brechas</span><b>' + h2[1] + '</b><small>' + (fr ? 'Friedman χ²(' + fr.gl + ') = ' + f2(fr.chi2) + ', p = ' + fp(fr.p) + ' · W de Kendall = ' + f2(fr.w) + ' · dimensión más baja: ' + esc(bajo.nombre) : 'Se necesitan al menos 3 negocios con las 7 dimensiones evaluadas') + '</small></div>' +
      '<div class="hip ' + h3[0] + '"><span>H3 · Validez convergente</span><b>' + h3[1] + '</b><small>' + (sp ? 'rho de Spearman = ' + f2(sp.rho) + ', p = ' + fp(sp.p) + ', n = ' + sp.n + ' (meta ≥ 0,30)' : 'Se necesitan al menos 5 negocios con seguidores registrados') + '</small></div></div>' +
      '<p class="nota">El contraste se calcula con los datos guardados. Con datos de prueba no tiene valor. Las pruebas de Wilcoxon y los intervalos de confianza del CCI se calculan en JASP o Python con el archivo CSV.</p>';
  }
  function vPanel() {
    var db = leer(), filtro = vPanel.f || 'Estudio';
    var evs = db.evals.filter(function (e) { return filtro === 'Todas' || e.origen === filtro; }), base = filtro === 'Estudio' ? unaPorNegocio(evs) : evs;
    var P = base.map(function (e) { return { e: e, p: puntajes(e.resp) }; }), idx = P.map(function (x) { return x.p.indice; });
    var cuenta = [0, 0, 0, 0]; idx.forEach(function (x) { if (x != null) cuenta[nivelDe(x).k]++; });
    var h = cab('panel') + '<main>' + avisoPrueba(db) + avisoRespaldo(db) + (hojaUrl() ? '<p class="hoja-linea" data-hoja-est>' + textoEstadoHoja() + '</p>' : '<div class="tarjeta sin-hoja"><div><b>Estos datos están solo en este equipo</b><p class="nota" style="margin:4px 0 0">Conecta la hoja de Google para que cada evaluación se guarde también en tu Google Drive y puedas verla desde cualquier lugar.</p></div><button class="btn pri chico" data-ir="config">Conectar la hoja de Google</button></div>') + '<div class="fila" style="margin-bottom:18px"><div><h1 style="font-size:34px;margin:0">Resultados de Cobija</h1><p class="sub" style="margin:4px 0 0">' +
      (filtro === 'Estudio' ? 'Muestra del estudio: una evaluación por negocio. Las segundas evaluaciones solo se usan para medir la confiabilidad.' : filtro === 'Feria' ? 'Diagnósticos hechos en la Feria. No forman parte de la muestra del estudio.' : 'Todas las evaluaciones guardadas.') + '</p></div><span class="espacio"></span>' +
      (db.evals.length ? '<button class="btn sec chico" data-excel>Descargar Excel</button>' : '') + '<div class="chips" id="fil">' + ['Estudio', 'Feria', 'Todas'].map(function (f) { return '<button class="chip' + (f === filtro ? ' on' : '') + '">' + f + '</button>'; }).join('') + '</div></div>';
    if (!P.length) h += '<div class="tarjeta vacio">Todavía no hay evaluaciones en «' + filtro + '».<div class="acciones" style="justify-content:center"><button class="btn pri" data-ir="nueva">Evaluar una marca</button><button class="btn sec" id="cargar">Importar respaldo</button></div></div>';
    else {
      var dimProm = {}; DIMS.forEach(function (d) { dimProm[d.id] = media(P.map(function (x) { return x.p.dims[d.id]; })); });
      var completos = P.filter(function (x) { return DIMS.every(function (d) { return x.p.dims[d.id] != null; }); });
      var fr = friedman(completos.map(function (x) { return DIMS.map(function (d) { return x.p.dims[d.id]; }); }));
      var conSeg = P.filter(function (x) { return x.e.seguidores != null && x.p.indice != null; });
      var sp = spearman(conSeg.map(function (x) { return x.e.seguidores; }), conSeg.map(function (x) { return x.p.indice; }));
      var c = confiabilidad(db);
      h += '<div class="kpis"><div class="kpi"><span>' + P.length + '</span><small>negocios</small></div><div class="kpi"><span>' + f0(media(idx)) + '</span><small>índice promedio (0–100)</small></div>' +
        '<div class="kpi"><span>' + f0(mediana(idx)) + '</span><small>mediana del índice</small></div><div class="kpi"><span>' + f0(Math.min.apply(null, idx)) + '–' + f0(Math.max.apply(null, idx)) + '</span><small>rango</small></div>' +
        (function () { var m = P.map(function (x) { return x.e.minutos; }).filter(function (x) { return x; }); return m.length ? '<div class="kpi"><span>' + f0(mediana(m)) + ' min</span><small>tiempo típico de revisión (mediana de ' + m.length + ')</small></div>' : ''; })() + '</div>';
      if (filtro === 'Estudio') h += '<div class="tarjeta"><h3>Contraste de hipótesis</h3>' + hipotesis(c, fr, sp, dimProm) + '</div>';
      var est2 = P.filter(function (x) { return x.e.estimacion != null && x.p.indice != null; });
      if (est2.length) { var mc = media(est2.map(function (x) { return x.e.estimacion; })), mr = media(est2.map(function (x) { return x.p.indice; })), sobre = est2.filter(function (x) { return x.e.estimacion > x.p.indice + 5; }).length;
        h += '<div class="tarjeta"><h3>Lo que creen los dueños vs. su presencia real</h3><p class="sub">Negocios de la Feria que dieron una estimación antes del diagnóstico. Es un dato descriptivo de la Feria, no del estudio.</p><div class="conf"><div><b>' + est2.length + '</b><small>negocios con estimación</small></div><div><b>' + f0(mc) + '</b><small>puntaje que creían tener (promedio)</small></div><div><b>' + f0(mr) + '</b><small>índice real (promedio)</small></div><div><b>' + f0(sobre / est2.length * 100) + ' %</b><small>se sobrestimaron más de 5 puntos</small></div></div></div>'; }
      h += '<div class="dos"><div class="tarjeta"><h3>Perfil promedio</h3>' + radarSVG(dimProm, null, { w: 380, h: 320 }) + '</div><div class="tarjeta"><h3>Promedio por dimensión</h3><div class="barras" style="margin-top:12px">' +
        DIMS.slice().sort(function (a, b) { return dimProm[b.id] - dimProm[a.id]; }).map(function (d) { var v = dimProm[d.id]; return '<div class="barra"><span>' + esc(d.nombre) + '</span><div class="t"><i style="width:' + (v || 0) + '%;background:' + COL[nivelDe(v || 0).k] + '"></i></div><b>' + f0(v) + '</b></div>'; }).join('') +
        '</div><h3 style="margin-top:22px">Distribución por nivel</h3><div class="dist">' + cuenta.map(function (n, i) { return n ? '<div style="flex:' + n + ';background:' + COL_T[i] + '">' + n + '</div>' : ''; }).join('') + '</div>' +
        '<div class="leyenda">' + R.niveles.map(function (n, i) { return '<span><i style="background:' + COL[i] + ';height:10px;width:10px;border-radius:3px"></i>' + n.nombre + ' (' + cuenta[i] + ')</span>'; }).join('') + '</div></div></div>';
      h += '<div class="dos"><div class="tarjeta"><h3>Distribución del índice</h3><p class="sub">Número de negocios por tramo de 10 puntos.</p>' + histograma(idx) + '</div>' +
        '<div class="tarjeta"><h3>Índice según seguidores</h3><p class="sub">' + (sp ? 'rho de Spearman = ' + f2(sp.rho) + ' (p = ' + fp(sp.p) + ', n = ' + sp.n + ')' : 'Registra los seguidores de al menos 5 negocios para ver la relación.') + '</p>' +
        (conSeg.length ? dispersion(conSeg.map(function (x) { return [x.e.seguidores, x.p.indice]; })) : '') + '</div></div>';
      if (fr) h += '<div class="tarjeta"><h3>Comparación entre dimensiones (prueba de Friedman)</h3><p class="sub">χ²(' + fr.gl + ') = ' + f2(fr.chi2) + ', p = ' + fp(fr.p) + ', W de Kendall = ' + f2(fr.w) + ', n = ' + fr.n + '. Un rango medio más bajo indica una dimensión más débil dentro de cada negocio.</p><table class="datos"><tr><th>Dimensión</th><th class="n">Rango medio</th><th class="n">Media (0–100)</th></tr>' +
        DIMS.map(function (d, j) { return [d, fr.rangoMedio[j]]; }).sort(function (a, b) { return a[1] - b[1]; }).map(function (x) { return '<tr><td>' + esc(x[0].nombre) + '</td><td class="n">' + f2(x[1]) + '</td><td class="n">' + f0(dimProm[x[0].id]) + '</td></tr>'; }).join('') + '</table></div>';
      var porR = {}; P.forEach(function (x) { (porR[x.e.rubro] = porR[x.e.rubro] || []).push(x); });
      h += '<div class="tarjeta"><h3>Mapa por rubro y dimensión</h3><p class="sub">Promedio de 0 a 100. Con pocos negocios por rubro, las diferencias son solo descriptivas.</p><div class="tabla-scroll"><table class="datos mapa-c"><tr><th>Rubro</th><th class="n">n</th>' + DIMS.map(function (d) { return '<th class="n">' + esc(d.corto) + '</th>'; }).join('') + '<th class="n">Índice</th></tr>' +
        Object.keys(porR).sort().map(function (r) { var L = porR[r]; return '<tr><td>' + esc(r) + '</td><td class="n">' + L.length + '</td>' + DIMS.map(function (d) { var v = media(L.map(function (x) { return x.p.dims[d.id]; })); return '<td class="n" style="background:' + colorCelda(v) + '">' + f0(v) + '</td>'; }).join('') +
          '<td class="n" style="background:' + colorCelda(media(L.map(function (x) { return x.p.indice; }))) + '"><b>' + f0(media(L.map(function (x) { return x.p.indice; }))) + '</b></td></tr>'; }).join('') + '</table></div></div>';
      var brechas = ITEMS.map(function (it) { var v = P.map(function (x) { return x.e.resp[it.id]; }).filter(ok); return { it: it, n: v.length, cero: v.length ? v.filter(function (x) { return x === 0; }).length / v.length * 100 : null, prom: media(v) }; })
        .filter(function (b) { return b.n; }).sort(function (a, b) { return b.cero - a.cero; });
      var D = P.map(function (x) { return x.e.datos || {}; }), num = function (k) { return D.map(function (d) { return typeof d[k] === 'number' ? d[k] : null; }).filter(function (v) { return v != null; }); };
      var resp = D.map(function (d) { return d.respuesta_min; }).filter(function (v) { return v != null; });
      var fichas = D.map(function (d) { return d.ficha; }).filter(Boolean);
      h += '<div class="dos"><div class="tarjeta"><h3>Brechas más frecuentes</h3><p class="sub">Indicadores en los que más negocios obtienen 0.</p><table class="datos"><tr><th>Indicador</th><th class="n">Con 0</th><th class="n">Prom. (0–2)</th></tr>' +
        brechas.slice(0, 7).map(function (b) { return '<tr><td>' + esc(b.it.nombre) + '<br><small class="gris">' + esc(dimDe(b.it.dim).nombre) + '</small></td><td class="n">' + f0(b.cero) + ' %</td><td class="n">' + f2(b.prom) + '</td></tr>'; }).join('') + '</table></div>' +
        '<div class="tarjeta"><h3>Datos observados</h3><p class="sub">Valores registrados al calificar los indicadores calculados.</p><div class="obs grande">' +
        '<div><small>Reseñas en Google (mediana)</small><b>' + f0(mediana(num('resenas'))) + '</b><em>n = ' + num('resenas').length + '</em></div>' +
        '<div><small>Calificación (mediana)</small><b>' + f1(mediana(D.filter(function (d) { return d.resenas; }).map(function (d) { return d.calificacion; }).filter(function (v) { return typeof v === 'number'; }))) + '</b><em>negocios con reseñas</em></div>' +
        '<div><small>Publicaciones en 30 días (mediana)</small><b>' + f0(mediana(num('posts30'))) + '</b><em>n = ' + num('posts30').length + '</em></div>' +
        '<div><small>Responde en menos de 1 hora</small><b>' + (resp.length ? f0(resp.filter(function (v) { return typeof v === 'number' && v < 60; }).length / resp.length * 100) + ' %' : '–') + '</b><em>n = ' + resp.length + '</em></div>' +
        '<div><small>Ficha de Google completa</small><b>' + (fichas.length ? f0(fichas.filter(function (f) { return f.length === 6; }).length / fichas.length * 100) + ' %' : '–') + '</b><em>n = ' + fichas.length + '</em></div>' +
        '<div><small>Sin ficha de Google</small><b>' + (fichas.length ? f0(fichas.filter(function (f) { return f.indexOf('Tiene ficha') < 0; }).length / fichas.length * 100) + ' %' : '–') + '</b><em>n = ' + fichas.length + '</em></div></div></div></div>';
    }
    var c2 = confiabilidad(db), bajos = c2.acuerdo.filter(function (a) { return a.n >= 3; }).sort(function (a, b) { return a.pct - b.pct; }).slice(0, 5);
    h += '<div class="tarjeta"><h3>Confiabilidad entre evaluadores</h3><p class="sub">Negocios del estudio evaluados por dos personas distintas, cada una sin ver la calificación de la otra.</p>' +
      '<div class="conf"><div><b>' + c2.pares + '</b><small>negocios con doble evaluación (meta: 30)</small></div><div><b>' + f2(c2.icc) + '</b><small>CCI(2,1) del índice · ' + lecturaICC(c2.icc) + '</small></div><div><b>' + f2(c2.kw) + '</b><small>Kappa ponderada · ' + lecturaK(c2.kw) + '</small></div><div><b>' + (c2.acuerdoMedio == null ? '–' : f0(c2.acuerdoMedio) + ' %') + '</b><small>acuerdo exacto en los indicadores</small></div></div>' +
      (bajos.length ? '<p class="sub" style="margin:14px 0 0">Indicadores con menor acuerdo (revisar su redacción o capacitar a los evaluadores):</p><table class="datos"><tr><th>Indicador</th><th class="n">Pares</th><th class="n">Acuerdo exacto</th></tr>' +
        bajos.map(function (a) { return '<tr><td>' + esc(a.it.id + ' · ' + a.it.nombre) + '</td><td class="n">' + a.n + '</td><td class="n">' + f0(a.pct) + ' %</td></tr>'; }).join('') + '</table>' : '') + '</div>';
    h += '<div class="tarjeta"><div class="fila"><h3 style="margin:0">Evaluaciones guardadas</h3><span class="espacio"></span><input type="search" id="buscar" placeholder="Buscar marca o rubro" style="max-width:280px"></div><div class="tabla-scroll"><table class="datos" id="tabla"><tr><th>Fecha</th><th>Marca</th><th>Rubro</th><th>Tipo</th><th class="n">Índice</th><th>Nivel</th><th></th></tr>' +
      (db.evals.length ? db.evals.slice().reverse().map(function (e) { var p = puntajes(e.resp), nv = nivelDe(p.indice);
        return '<tr data-txt="' + esc((e.nombre + ' ' + e.rubro + ' ' + e.evaluador + ' ' + e.origen).toLowerCase()) + '"><td>' + fecha(e.fecha) + '</td><td class="td-marca">' + (fotoDe(e) ? '<img class="mini-foto" src="' + fotoDe(e) + '" alt="">' : '') + esc(e.nombre) + '</td><td>' + esc(e.rubro) + '</td><td>' + esc(e.origen) + '</td><td class="n">' + f0(p.indice) + '</td><td>' + (nv ? '<span class="pill-n n' + nv.k + '">' + nv.n.nombre + '</span>' : '–') +
          '</td><td class="n"><button class="btn sec chico" data-ver="' + e.id + '">Ver</button> <button class="btn peligro chico" data-borrar="' + e.id + '">Borrar</button></td></tr>'; }).join('') : '<tr><td colspan="8" class="vacio">Sin evaluaciones</td></tr>') + '</table></div>' +
      '<div class="acciones"><button class="btn pri chico" id="xx">Descargar Excel</button><button class="btn sec chico" id="xa">CSV ancho</button><button class="btn sec chico" id="xl">CSV largo</button><button class="btn sec chico" id="xj">Descargar respaldo (JSON)</button><button class="btn sec chico" id="cargar2">Importar respaldo</button><span class="espacio"></span><button class="btn peligro chico" id="todo">Borrar todo</button></div>' +
      '<p class="nota"><b>Descargar Excel</b> trae todas las respuestas guardadas en este equipo en un archivo .xlsx con estas pestañas: «Evaluaciones» (una fila por negocio con sus 21 respuestas, puntajes y datos), «Respuestas por indicador» (una fila por indicador, con el texto de la opción elegida), «Expertos» y «V de Aiken» (si hay calificaciones) y «Diccionario» (qué significa cada columna). Los CSV traen lo mismo en texto simple, para SPSS, R o Jamovi.</p>' +
      '<p class="nota">Para juntar los datos de varias computadoras, conecta la hoja de Google o descarga el respaldo en cada una e impórtalo en la principal. Las evaluaciones repetidas no se duplican.</p></div></main><input type="file" id="arch" accept=".json,application/json" hidden>';
    app.innerHTML = h; enlazar(); enlazarRespaldo(); enlazarPrueba();
    $$('#fil .chip').forEach(function (b) { b.onclick = function () { vPanel.f = b.textContent; vPanel(); }; });
    $$('[data-ver]').forEach(function (b) { b.onclick = function () { ir('informe', b.dataset.ver); }; });
    $$('[data-borrar]').forEach(function (b) { b.onclick = function () { if (!confirmar(b)) return; var d = leer(); d.evals = d.evals.filter(function (x) { return x.id !== b.dataset.borrar; }); escribir(d); fotoGuardar(b.dataset.borrar, null); marcarBorrado('Evaluaciones', b.dataset.borrar); subirPronto(); vPanel(); }; });
    $('#buscar').oninput = function () { var q = this.value.toLowerCase(); $$('#tabla tr[data-txt]').forEach(function (tr) { tr.style.display = tr.dataset.txt.indexOf(q) >= 0 ? '' : 'none'; }); };
    var arch = $('#arch'); [$('#cargar'), $('#cargar2')].forEach(function (b) { if (b) b.onclick = function () { arch.click(); }; });
    arch.onchange = function () { var f = arch.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { importar(r.result); }; r.readAsText(f); };
    $('#xa').onclick = function () { descargar('radar_ancho.csv', csvAncho(db.evals)); }; $('#xl').onclick = function () { descargar('radar_largo.csv', csvLargo(db.evals)); };
    $('#xj').onclick = descargarRespaldo; $('#xx').onclick = descargarExcel; $$('[data-excel]').forEach(function (b) { b.onclick = descargarExcel; });
    $('#todo').onclick = function () { if (!confirmar(this)) return; var d = leer(); d.evals.forEach(function (e) { fotoGuardar(e.id, null); }); d.evals = []; escribir(d); vPanel(); };
  }

  /* ================================================================ investigación: expertos (V de Aiken), dueños y evaluadores */
  /* V de Aiken (Aiken, 1985) con escala de 1 a 4; intervalo de confianza por el método score (Penfield y Giacobbi, 2004) */
  function aiken(vals, c) {
    var n = vals.length; if (!n) return null; c = c || 4; var k = c - 1, V = vals.reduce(function (a, x) { return a + (x - 1); }, 0) / (n * k), z = 1.96;
    var r = Math.sqrt(4 * n * k * V * (1 - V) + z * z), den = 2 * (n * k + z * z);
    return { V: V, li: (2 * n * k * V + z * z - z * r) / den, ls: (2 * n * k * V + z * z + z * r) / den, n: n };
  }
  var V_MIN = 0.70, expSel = 1, verEjemplo = false;
  /* Ejemplo de demostración con 7 expertos FICTICIOS: se muestra siempre con un aviso y nunca se mezcla con los datos reales */
  function ejemploAiken() {
    var A = { n: 7, nombres: {}, r: {}, c: {}, ejemplo: true }, baseR = [4, 4, 3, 4, 4, 3, 4], baseC = [4, 3, 4, 4, 3, 4, 4];
    var esp = { 'D7.1': { r: [3, 2, 2, 3, 2, 3, 2] }, 'D2.3': { c: [3, 2, 2, 3, 2, 3, 2] }, 'D1.2': { r: [4, 3, 3, 4, 3, 3, 4] } };
    for (var e = 1; e <= 7; e++) A.nombres[e] = 'Experto ficticio ' + e;
    A.s = {}; A.com = {}; DIMS.forEach(function (d, k) { A.s[d.id] = {}; for (var e = 1; e <= 7; e++) A.s[d.id][e] = d.id === 'D7' ? [3, 3, 2, 3, 3, 2, 3][e - 1] : [4, 3, 4, 4, 3, 4, 4][(e - 1 + k) % 7]; });
    A.com.D7 = { 2: 'Ejemplo ficticio: agregaría un indicador sobre el uso de estadísticas de las redes.' };
    ITEMS.forEach(function (it, k) { A.r[it.id] = {}; A.c[it.id] = {};
      for (var e = 1; e <= 7; e++) { var i = (e - 1 + k) % 7, x = esp[it.id] || {};
        A.r[it.id][e] = (x.r || baseR)[x.r ? e - 1 : i]; A.c[it.id][e] = (x.c || baseC)[x.c ? e - 1 : i]; } });
    return A;
  }
  function datosAiken(db) { var X = db.expertos = db.expertos || {}; X.aiken = X.aiken || { n: 5, nombres: {}, r: {}, c: {} }; X.aiken.s = X.aiken.s || {}; X.aiken.com = X.aiken.com || {}; return X.aiken; }
  function filasAiken(A) {
    return ITEMS.map(function (it) {
      var vr = [], vc = []; for (var e = 1; e <= A.n; e++) { var x = (A.r[it.id] || {})[e], y = (A.c[it.id] || {})[e]; if (x) vr.push(x); if (y) vc.push(y); }
      var R2 = vr.length === A.n ? aiken(vr) : null, C2 = vc.length === A.n ? aiken(vc) : null;
      var dec = !R2 ? ['gris', 'Incompleto'] : R2.V < V_MIN ? ['n0', 'Revisar o eliminar'] : C2 && C2.V < V_MIN ? ['n1', 'Mejorar la redacción'] : ['n3', 'Se mantiene'];
      return { it: it, r: R2, c: C2, nr: vr.length, nc: vc.length, dec: dec };
    });
  }
  function vExpertos() {
    var db = leer(), A = verEjemplo ? ejemploAiken() : datosAiken(db), N = A.n; if (expSel > N) expSel = 1;
    var F = filasAiken(A), listos = F.filter(function (f) { return f.r; }), mant = listos.filter(function (f) { return f.dec[1] === 'Se mantiene'; });
    var completos = function (e) { return ITEMS.filter(function (it) { return (A.r[it.id] || {})[e] && (A.c[it.id] || {})[e]; }).length; };
    var dv = resumenDevolucion(db), c2 = confiabilidad(db);
    var h = cab('expertos') + '<main><h1 style="font-size:34px;margin:0">Investigación</h1><p class="sub" style="margin:4px 0 ' + (hojaUrl() ? '8' : '18') + 'px">Evidencia para validar Marki ante el jurado. No hace falta para evaluar negocios.</p>' + (hojaUrl() ? '<p class="hoja-linea" data-hoja-est>' + textoEstadoHoja() + '</p>' : '<div class="tarjeta sin-hoja"><div><b>Estos datos están solo en este equipo</b><p class="nota" style="margin:4px 0 0">Conecta la hoja de Google para que cada evaluación se guarde también en tu Google Drive y puedas verla desde cualquier lugar.</p></div><button class="btn pri chico" data-ir="config">Conectar la hoja de Google</button></div>') +
      '<div class="inv3"><div class="tarjeta"><h3>Opinión de los dueños</h3>' + (dv.n ? '<div class="inv-n"><b>' + dv.n + '</b><small>dueños respondieron</small></div><ul class="inv-l">' +
        (dv.q1 ? '<li><b>' + f0(dv.q1.pct) + ' %</b> dice que el diagnóstico describe bien su situación (4 o 5 de 5)</li>' : '') +
        (dv.q2 ? '<li><b>' + f0(dv.q2.pct) + ' %</b> considera útiles y posibles las acciones (4 o 5 de 5)</li>' : '') +
        (dv.q3 ? '<li><b>' + f0(dv.q3.si) + ' %</b> aplicará alguna acción el próximo mes; ' + f0(dv.q3.tv) + ' % tal vez</li>' : '') + '</ul>'
        : '<p class="nota">Aún no hay respuestas. Se registran al final de cada diagnóstico, en «Opinión del dueño».</p>') + '</div>' +
      '<div class="tarjeta"><h3>Confiabilidad entre evaluadores</h3>' + (c2.pares ? '<div class="inv-n"><b>' + c2.pares + '</b><small>negocios evaluados por dos personas</small></div><ul class="inv-l"><li>CCI(2,1) del índice: <b>' + f2(c2.icc) + '</b></li><li>Kappa ponderado de los indicadores: <b>' + f2(c2.kw) + '</b></li></ul>'
        : '<p class="nota">Aún no hay negocios evaluados por dos personas. Se calcula cuando el mismo negocio se evalúa dos veces, por dos estudiantes distintos y sin ver la primera evaluación.</p>') + '<button class="btn sec chico" data-ir="panel">Ver el detalle en Resultados</button></div>' +
      '<div class="tarjeta"><h3>Validación por expertos' + (verEjemplo ? ' <span class="pill-n n1">ejemplo ficticio</span>' : '') + '</h3><div class="inv-n"><b>' + listos.length + ' / ' + ITEMS.length + '</b><small>indicadores calificados por los ' + N + ' expertos</small></div><ul class="inv-l"><li><b>' + mant.length + '</b> se mantienen (V ≥ ' + f2(V_MIN) + ')</li>' +
        (listos.length ? '<li>V promedio de relevancia: <b>' + f2(media(listos.map(function (f) { return f.r.V; }))) + '</b></li>' : '') + '</ul></div></div>' +
      (verEjemplo ? '<div class="tarjeta alerta-p ejemplo-aviso"><div><b>Ejemplo ficticio con 7 expertos inventados</b><small>Solo muestra cómo funciona la validación. No son resultados de la investigación y no se guardan ni se exportan.</small></div><button class="btn sec" id="ejOff">Quitar el ejemplo</button></div>' : '') +
      '<div class="tarjeta"><div class="fila" style="align-items:flex-end;gap:16px;flex-wrap:wrap"><div style="flex:1;min-width:280px"><h2 style="margin:0 0 4px">Juicio de expertos · V de Aiken</h2><p class="sub" style="margin:0">Para cada indicador, el experto califica de 1 a 4 la <b>relevancia</b> (¿sirve para medir la presencia digital?) y la <b>claridad</b> (¿se entiende sin ambigüedad?).</p>' +
      '<div class="acciones" style="margin:12px 0 0">' + (verEjemplo ? '' : '<button class="btn pri" data-ir="experto">Responder como experto (10 a 15 minutos)</button><button class="btn sec" id="ejOn">Ver un ejemplo con datos ficticios</button>') + '</div></div>' +
      '<label class="campo" style="max-width:170px"><b>Número de expertos</b><select id="nexp"' + (verEjemplo ? ' disabled' : '') + '>' + [3, 4, 5, 6, 7, 8, 9, 10].map(function (k) { return '<option' + (k === N ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="exp-tabs" role="tablist">' + Array.apply(null, Array(N)).map(function (_, k) { var e = k + 1, cc = completos(e); return '<button role="tab" aria-selected="' + (e === expSel) + '" data-exp="' + e + '" class="' + (e === expSel ? 'act' : '') + (cc === ITEMS.length ? ' ok' : '') + '"><b>Experto ' + e + '</b><small>' + esc(A.nombres[e] || 'sin nombre') + ' · ' + cc + '/' + ITEMS.length + '</small></button>'; }).join('') + '</div>' +
      '<div class="exp-cab"><label class="campo"><b>Nombre y profesión del experto ' + expSel + '</b><input id="enom"' + (verEjemplo ? ' disabled' : '') + ' value="' + esc(A.nombres[expSel] || '') + '" placeholder="Ej.: Lic. Ana Pérez, docente de Marketing"></label><p class="nota">Relevancia: 1 se puede quitar · 2 poco relevante · 3 relevante · 4 muy relevante.<br>Claridad: 1 no se entiende · 2 muchos cambios · 3 un cambio menor · 4 es claro.<br>Suficiencia: 1 no alcanzan · 2 miden solo una parte · 3 falta algún indicador · 4 son suficientes.</p></div>' +
      '<div class="exp-items">';
    DIMS.forEach(function (d) {
      h += '<h4>' + esc(d.id + '. ' + d.nombre) + '</h4>';
      var sv = (A.s[d.id] || {})[expSel];
      h += '<div class="exp-it exp-suf"><div><b>Suficiencia de la dimensión</b><small>¿Los indicadores alcanzan para medir «' + esc(d.nombre) + '»?</small></div><div></div><div class="exp-esc" data-it="' + d.id + '" data-t="s"><span>Suficiencia</span>' + [1, 2, 3, 4].map(function (x) { return '<button class="' + (sv === x ? 'on' : '') + '">' + x + '</button>'; }).join('') + '</div></div>';
      d.items.forEach(function (it) { var r = (A.r[it.id] || {})[expSel], c = (A.c[it.id] || {})[expSel];
        h += '<div class="exp-it"><div><b>' + it.id + ' ' + esc(it.nombre) + '</b><small>' + esc(it.n[2]) + '</small></div>' +
          ['r', 'c'].map(function (t) { var v = t === 'r' ? r : c; return '<div class="exp-esc" data-it="' + it.id + '" data-t="' + t + '"><span>' + (t === 'r' ? 'Relevancia' : 'Claridad') + '</span>' + [1, 2, 3, 4].map(function (x) { return '<button class="' + (v === x ? 'on' : '') + '">' + x + '</button>'; }).join('') + '</div>'; }).join('') + '</div>'; });
    });
    h += '</div>' + (expSel < N ? '<div class="acciones"><span class="espacio"></span><button class="btn pri" data-exp="' + (expSel + 1) + '">Siguiente: experto ' + (expSel + 1) + '</button></div>' : '') + '</div>' +
      '<div class="tarjeta"><h3>Resultados por indicador</h3><div class="tabla-scroll"><table class="datos expertos"><tr><th>Indicador</th><th class="n">V relevancia</th><th class="n">IC 95 %</th><th class="n">V claridad</th><th>Decisión</th></tr>';
    var dimAnt = '';
    F.forEach(function (f) {
      if (f.it.dim !== dimAnt) { dimAnt = f.it.dim; h += '<tr class="sep"><td colspan="5">' + esc(f.it.dim + '. ' + dimDe(f.it.dim).nombre) + '</td></tr>'; }
      h += '<tr><td><b>' + f.it.id + '</b> ' + esc(f.it.nombre) + '</td><td class="n"><b>' + (f.r ? f2(f.r.V) : f.nr + '/' + N) + '</b></td><td class="n">' + (f.r ? f2(f.r.li) + ' – ' + f2(f.r.ls) : '') + '</td><td class="n">' + (f.c ? f2(f.c.V) : f.nc + '/' + N) + '</td><td><span class="pill-n ' + f.dec[0] + '">' + f.dec[1] + '</span></td></tr>';
    });
    h += '</table></div>' +
      '<h3 style="margin-top:22px">Suficiencia por dimensión</h3><div class="tabla-scroll"><table class="datos expertos"><tr><th>Dimensión</th><th class="n">V suficiencia</th><th>Decisión</th><th>Comentarios de los expertos</th></tr>' +
      DIMS.map(function (d) { var vs = []; for (var e = 1; e <= N; e++) { var x = (A.s[d.id] || {})[e]; if (x) vs.push(x); } var S2 = vs.length === N ? aiken(vs) : null, cm = A.com[d.id] || {};
        return '<tr><td><b>' + d.id + '</b> ' + esc(d.nombre) + '</td><td class="n"><b>' + (S2 ? f2(S2.V) : vs.length + '/' + N) + '</b></td><td>' + (!S2 ? '<span class="pill-n gris">Incompleto</span>' : S2.V >= V_MIN ? '<span class="pill-n n3">Bastan</span>' : '<span class="pill-n n1">Agregar o ajustar</span>') + '</td><td class="com">' +
          Object.keys(cm).map(function (e) { return '<div><b>E' + e + ':</b> ' + esc(cm[e]) + '</div>'; }).join('') + '</td></tr>'; }).join('') + '</table></div>' +
      '<div class="acciones"><button class="btn sec chico" data-ir="formulario">Imprimir formulario para expertos</button><button class="btn sec chico" id="xe">Descargar CSV</button><button class="btn sec chico" id="xex">Descargar Excel</button><span class="espacio"></span><button class="btn peligro chico" id="limpiar">Borrar calificaciones</button></div>' +
      '<p class="nota">V = S / [n (c − 1)], donde S es la suma de (calificación − 1) de los n expertos y c = 4 el número de valores de la escala (Aiken, 1985). Intervalo de confianza del 95 % por el método score (Penfield y Giacobbi, 2004). Criterio: el indicador se mantiene si la V de relevancia y la de claridad son ≥ ' + f2(V_MIN) + ' (Charter, 2003, citado en Merino y Livia, 2009). Criterios y escalas basados en Escobar-Pérez y Cuervo-Martínez (2008). La V se calcula cuando los ' + N + ' expertos calificaron el indicador.</p></div></main>';
    app.innerHTML = h; enlazar();
    $('#xex').onclick = descargarExcel;
    if (verEjemplo) { $$('.exp-esc button,#limpiar,#xe,#xex').forEach(function (b) { b.disabled = true; }); }
    if ($('#ejOn')) $('#ejOn').onclick = function () { verEjemplo = true; expSel = 1; vExpertos(); };
    if ($('#ejOff')) $('#ejOff').onclick = function () { verEjemplo = false; expSel = 1; vExpertos(); };
    var guardar = function (fn) { if (verEjemplo) return; var d = leer(); fn(datosAiken(d)); escribir(d); encolarExperto(expSel); subirPronto(); };
    $('#nexp').onchange = function () { var n = +this.value; guardar(function (a) { a.n = n; }); vExpertos(); };
    $$('[data-exp]').forEach(function (b) { b.onclick = function () { expSel = +b.dataset.exp; vExpertos(); var t = document.querySelector('.exp-tabs'); if (t) t.scrollIntoView({ block: 'start' }); }; });
    $('#enom').onchange = function () { var v = this.value.trim(); guardar(function (a) { a.nombres[expSel] = v; }); };
    $$('.exp-esc').forEach(function (g) { g.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; var v = +b.textContent, it = g.dataset.it, t = g.dataset.t;
      guardar(function (a) { a[t] = a[t] || {}; a[t][it] = a[t][it] || {}; a[t][it][expSel] = a[t][it][expSel] === v ? undefined : v; });
      var y = window.scrollY; vExpertos(); window.scrollTo(0, y); }; });
    $('#limpiar').onclick = function () { if (!confirmar(this)) return; var A0 = datosAiken(leer()); Object.keys(A0.ids || {}).forEach(function (k) { marcarBorrado('Expertos', A0.ids[k]); });
      if (verEjemplo) return; var d0 = leer(), a = datosAiken(d0); a.r = {}; a.c = {}; a.nombres = {}; a.s = {}; a.com = {}; a.ids = {}; escribir(d0); guardarLista(CLAVE_COLA_EXP, []); subirPronto(); expSel = 1; vExpertos(); };
    $('#xe').onclick = function () { var col = []; for (var e = 1; e <= N; e++) col.push('relevancia_e' + e, 'claridad_e' + e);
      descargar('juicio_expertos_aiken.csv', csv([['indicador', 'nombre'].concat(col).concat(['v_relevancia', 'ic95_inferior', 'ic95_superior', 'v_claridad', 'decision'])]
        .concat(F.map(function (f) { var v = []; for (var e = 1; e <= N; e++) v.push((A.r[f.it.id] || {})[e] || '', (A.c[f.it.id] || {})[e] || '');
          return [f.it.id, f.it.nombre].concat(v).concat(f.r ? [r2(f.r.V), r2(f.r.li), r2(f.r.ls)] : ['', '', '']).concat([f.c ? r2(f.c.V) : '', f.dec[1]]); }))
        .concat([[''], ['expertos'].concat(Array.apply(null, Array(N)).map(function (_, k) { return 'E' + (k + 1) + ': ' + (A.nombres[k + 1] || ''); }))]))); };
  }
  /* Asistente para que un experto responda solo, en unos 4 minutos: una dimensión por paso */
  /* Escalas de 1 a 4 basadas en la planilla de Escobar-Pérez y Cuervo-Martínez (2008) */
  var ESC_R = [['Se puede quitar', 'Quitarlo no afecta la medición'], ['Poco relevante', 'Otro indicador ya mide lo mismo'], ['Relevante', 'Es importante'], ['Muy relevante', 'Debe estar en Marki']],
    ESC_C = [['No se entiende', ''], ['Necesita muchos cambios', 'En sus palabras o niveles'], ['Necesita un cambio menor', 'En alguna palabra'], ['Es claro', 'Se entiende sin dudas']],
    ESC_S = [['No alcanzan', 'No miden la dimensión'], ['Miden solo una parte', ''], ['Falta algún indicador', ''], ['Son suficientes', '']], RX = null;
  var PREG_R = '¿Este indicador debe estar en Marki para medir la presencia digital?', PREG_C = '¿El indicador y sus tres niveles se entienden?';
  function vResponder() {
    if (!RX || RX.fin) RX = { paso: 0, nombre: '', prof: '', r: {}, c: {}, s: {}, com: {} };
    var paso = RX.paso, h = cab('expertos') + '<main class="resp-exp"><div class="tarjeta">';
    if (paso === 0) {
      h += '<span class="dim-n">Validación de Marki · entre 10 y 15 minutos</span><h1>Gracias por ayudarnos a validar Marki</h1>' +
        '<p class="sub"><b>Qué es Marki:</b> una herramienta que diagnostica la presencia digital de un negocio de Cobija, es decir, lo que un cliente puede ver, encontrar y hacer con el negocio en internet (redes sociales, Google Maps y ChatGPT), usando solo información pública. Con el resultado, el dueño recibe un diagnóstico y un plan de mejora.</p>' +
        '<p class="sub"><b>Qué le pedimos:</b> que revise los 21 indicadores de Marki en 7 pasos, uno por dimensión. Cada indicador se califica en tres niveles (0, 1 y 2). Para cada indicador responda:</p>' +
        '<ul class="rx-def"><li><b>Relevancia:</b> ' + PREG_R + '</li><li><b>Claridad:</b> ' + PREG_C + '</li></ul><p class="sub">Al final de cada paso le preguntaremos si esos indicadores <b>alcanzan</b> para medir la dimensión. No hay respuestas correctas ni incorrectas: buscamos su opinión profesional.</p>' +
        '<div class="fila" style="gap:14px;flex-wrap:wrap;margin-top:14px"><label class="campo" style="flex:1;min-width:240px"><b>Nombre y apellido</b><input id="rxn" value="' + esc(RX.nombre) + '" placeholder="Ej.: Lic. Ana Pérez"></label><label class="campo" style="flex:1;min-width:240px"><b>Profesión o cargo, e institución donde trabaja</b><input id="rxp" value="' + esc(RX.prof) + '" placeholder="Ej.: docente de Marketing, UAP"></label></div>' +
        '<div class="acciones"><button class="btn sec" data-ir="expertos">Cancelar</button><span class="espacio"></span><button class="btn pri" id="rxIr">Empezar</button></div>';
    } else if (paso <= DIMS.length) {
      var d = DIMS[paso - 1];
      h += '<div class="rx-prog"><span style="width:' + Math.round((paso - 1) / DIMS.length * 100) + '%"></span></div><span class="dim-n">Paso ' + paso + ' de ' + DIMS.length + '</span><div class="dim-cab" style="margin:6px 0 14px"><span class="num">' + icono(d.id, 24) + '</span><div><h2 style="margin:0">' + esc(d.nombre) + '</h2><p class="sub" style="margin:0">' + esc(d.pregunta) + '</p></div></div>' +
        d.items.map(function (it) { return '<div class="rx-it' + (RX.r[it.id] && RX.c[it.id] ? ' listo' : '') + '"><b>' + it.id + ' ' + esc(it.nombre) + '</b><p class="rx-que"><b>Qué mide:</b> ' + esc(it.que || '') + '</p><p class="rx-donde"><b>Dónde se observa:</b> ' + esc(it.donde) + '</p>' +
          '<ol class="rx-niv" start="0">' + it.n.map(function (t, k) { return '<li><span>' + k + '</span>' + esc(t) + '</li>'; }).join('') + '</ol>' +
          [['r', PREG_R, ESC_R], ['c', PREG_C, ESC_C]].map(function (q) { return htmlEscala(q[1], q[2], it.id, q[0], RX[q[0]][it.id]); }).join('') + '</div>'; }).join('') +
        '<div class="rx-it rx-suf' + (RX.s[d.id] ? ' listo' : '') + '"><b>Para cerrar este paso</b>' + htmlEscala('¿Estos ' + d.items.length + ' indicadores alcanzan para medir «' + d.nombre + '»?', ESC_S, d.id, 's', RX.s[d.id]) +
        '<label class="rx-com"><span>¿Qué cambiaría o agregaría? (opcional)</span><textarea id="rxCom" rows="2" placeholder="Por ejemplo: cambiar una palabra, agregar un indicador…">' + esc(RX.com[d.id] || '') + '</textarea></label></div>' +
        '<div class="acciones"><button class="btn sec" id="rxAtras">Anterior</button><span class="espacio"></span><button class="btn pri" id="rxSig">' + (paso === DIMS.length ? 'Terminar' : 'Siguiente') + '</button></div>';
    } else {
      h += '<div class="rx-fin"><span class="logo-g">' + LOGO_ICONO + '</span><h1>¡Gracias, ' + esc(RX.nombre.split(' ').slice(0, 2).join(' ')) + '!</h1><p class="sub">Su respuesta se guardó como <b>experto ' + RX.num + '</b>. Con ella, Marki recalcula la V de Aiken de cada indicador.</p>' +
        '<div class="acciones" style="justify-content:center"><button class="btn sec" id="rxOtro">Responde otro experto</button><button class="btn pri" data-ir="expertos">Ver los resultados</button></div></div>';
    }
    app.innerHTML = h + '</div></main>'; enlazar();
    if (paso === 0) { $('#rxn').focus(); $('#rxIr').onclick = function () { RX.nombre = $('#rxn').value.trim(); RX.prof = $('#rxp').value.trim(); if (!RX.nombre) { aviso('Escribe el nombre del experto.', 'err'); $('#rxn').focus(); return; } RX.paso = 1; vResponder(); }; return; }
    if (paso > DIMS.length) { $('#rxOtro').onclick = function () { RX = null; vResponder(); }; return; }
    $$('.rx-op').forEach(function (g) { g.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; RX[g.dataset.t][g.dataset.it] = +b.dataset.v;
      g.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      g.closest('.rx-it').classList.toggle('listo', g.dataset.t === 's' ? true : !!(RX.r[g.dataset.it] && RX.c[g.dataset.it])); }; });
    var com = $('#rxCom'); if (com) com.oninput = function () { RX.com[DIMS[paso - 1].id] = com.value; };
    $('#rxAtras').onclick = function () { RX.paso--; vResponder(); };
    $('#rxSig').onclick = function () {
      var falt = DIMS[paso - 1].items.filter(function (it) { return !RX.r[it.id] || !RX.c[it.id]; }).map(function (it) { return it.nombre; });
      if (!RX.s[DIMS[paso - 1].id]) falt.push('si los indicadores alcanzan');
      if (falt.length) { aviso('Falta responder: ' + falt.join(', ') + '.', 'err'); return; }
      if (paso < DIMS.length) { RX.paso++; vResponder(); return; }
      var db = leer(), A = datosAiken(db), num = 0;
      for (var e = 1; e <= A.n && !num; e++) { var usado = !!A.nombres[e] || ITEMS.some(function (it) { return (A.r[it.id] || {})[e] || (A.c[it.id] || {})[e]; }); if (!usado) num = e; }
      if (!num) { if (A.n >= 10) { aviso('Ya hay 10 expertos registrados.', 'err'); return; } A.n++; num = A.n; }
      A.nombres[num] = RX.nombre + (RX.prof ? ', ' + RX.prof : '');
      ITEMS.forEach(function (it) { (A.r[it.id] = A.r[it.id] || {})[num] = RX.r[it.id]; (A.c[it.id] = A.c[it.id] || {})[num] = RX.c[it.id]; });
      A.s = A.s || {}; A.com = A.com || {}; DIMS.forEach(function (d) { (A.s[d.id] = A.s[d.id] || {})[num] = RX.s[d.id]; if ((RX.com[d.id] || '').trim()) (A.com[d.id] = A.com[d.id] || {})[num] = RX.com[d.id].trim(); });
      escribir(db); RX.num = num; encolarExpertos(); RX.paso++; RX.fin = false; vResponder(); RX.fin = true;
    };
  }
  function encolarExpertos() { if (RX && RX.num) { encolarExperto(RX.num); subir(); } }
  function htmlEscala(preg, esc4, id, t, v) {
    return '<div class="rx-q"><span>' + preg + '</span><div class="rx-op" data-it="' + id + '" data-t="' + t + '">' + esc4.map(function (o, k) {
      return '<button class="' + (v === k + 1 ? 'on' : '') + '" data-v="' + (k + 1) + '"><b>' + (k + 1) + '</b>' + o[0] + (o[1] ? '<small>' + o[1] + '</small>' : '') + '</button>'; }).join('') + '</div></div>';
  }

  /* Formulario de validación de contenido por juicio de expertos: relevancia y claridad de 1 a 4 (V de Aiken, 1985) y suficiencia por dimensión */
  function vFormulario() {
    /* Mismo contenido que el formulario impreso en Word (formularios/Marki_Validacion_por_expertos): opciones escritas, sin tener que recordar qué significa cada número */
    var caja = '<span class="cx"></span>', lin = function (t, w) { return '<span class="lin"><b>' + t + '</b><i style="min-width:' + (w || 160) + 'px"></i></span>'; };
    var ops = function (L) { return L.map(function (t, i) { return '<span class="f-op">' + caja + ' ' + esc(t) + ' <small>(' + (i + 1) + ')</small></span>'; }).join(''); };
    var OR = ['Se puede quitar', 'Poco relevante', 'Relevante', 'Muy relevante'], OC = ['No se entiende', 'Necesita muchos cambios', 'Necesita un cambio menor', 'Es claro'], OS = ['No alcanzan', 'Miden solo una parte', 'Falta algún indicador', 'Son suficientes'];
    var h = cab('') + '<main class="formulario">' +
      '<header class="f-cab"><div class="f-logo">' + LOGO_COLOR + '</div><div><small>Universidad Amazónica de Pando · Carrera de Ingeniería Comercial · Marketing Digital (ICOM261)</small>' +
      '<h1>Validación de Marki por juicio de expertos</h1><p>¿Los indicadores de Marki miden bien la presencia digital? · Rúbrica versión ' + esc(R.version) + ' · entre 10 y 15 minutos</p></div></header>' +
      '<section class="f-sec"><p><b>Marki</b> es una herramienta de la UAP que revisa lo que un cliente puede ver de un negocio de Cobija en internet (redes sociales, Google Maps y ChatGPT) y le entrega al dueño un diagnóstico y un plan de mejora. Para hacerlo, califica 21 indicadores, agrupados en 7 dimensiones. Necesitamos su opinión profesional sobre esos indicadores. No hay respuestas correctas ni incorrectas.</p></section>' +
      '<section class="f-sec"><h2>Datos del experto</h2><div class="f-datos">' + lin('Nombre y apellido', 420) + lin('Fecha', 140) + lin('Profesión o cargo, e institución donde trabaja', 420) + '</div></section>' +
      '<section class="f-sec f-inst"><h2>Cómo responder</h2><ol>' +
      '<li><b>Lea el indicador:</b> qué mide, dónde se observa y sus tres niveles (0, 1 y 2).</li>' +
      '<li><b>Marque si debe estar en Marki:</b> ¿es importante para medir la presencia digital de un negocio?</li>' +
      '<li><b>Marque si se entiende:</b> ¿el indicador y sus niveles están escritos con claridad?</li>' +
      '<li><b>Al terminar cada dimensión,</b> marque si sus indicadores alcanzan para medirla. Si quiere, escriba qué cambiaría.</li></ol>' +
      '<p class="nota">Marque solo una opción en cada pregunta. El número entre paréntesis sirve para registrar su respuesta en Marki.</p></section>';
    DIMS.forEach(function (d, di) {
      var cabD = '<h3 class="f-dh">Dimensión ' + (di + 1) + ' de 7 · ' + esc(d.nombre) + '<small>Esta dimensión responde a la pregunta: ' + esc(d.pregunta || '') + '</small></h3>';
      h += '<section class="f-dim">' +
        d.items.map(function (it, ii) { return (ii === 0 ? '<div class="f-grupo">' + cabD : '') + '<div class="f-it"><div class="f-in"><b>Indicador ' + it.id + ' · ' + esc(it.nombre) + '</b></div>' +
          '<p class="f-q"><b>Qué mide:</b> ' + esc(punto(it.que)) + '<br><b>Dónde se observa:</b> ' + esc(punto(it.donde)) + '</p>' +
          '<div class="f-niv">' + it.n.map(function (t, v) { return '<div><b class="n' + v + '">Nivel ' + v + (v === 0 ? ' · el más bajo' : v === 2 ? ' · el más alto' : '') + '</b>' + esc(t) + '</div>'; }).join('') + '</div>' +
          '<p class="f-pr"><b>1. ¿Este indicador debe estar en Marki para medir la presencia digital?</b><br>' + ops(OR) + '</p>' +
          '<p class="f-pr"><b>2. ¿Se entiende el indicador y sus tres niveles?</b><br>' + ops(OC) + '</p>' +
          '<p class="f-obs">Observación (opcional)<i></i></p></div>' + (ii === 0 ? '</div>' : ''); }).join('') + /* el título de la dimensión no queda solo al pie de una hoja */
        '<div class="f-suf"><p><b>Para cerrar la dimensión: ¿estos ' + d.items.length + ' indicadores alcanzan para medir «' + esc(d.nombre) + '»?</b><br>' + ops(OS) + '</p><p class="f-obs">¿Qué cambiaría o agregaría en esta dimensión? (opcional)<i></i></p></div></section>';
    });
    h += '<section class="f-sec f-final"><p class="nota">Muchas gracias por su tiempo. Sus respuestas se registran en Marki (Investigación → Responder como experto) para calcular el acuerdo entre expertos (V de Aiken). Un indicador se mantiene si V ≥ 0,70.</p>' +
      '<div class="f-firma"><div><i></i>Firma del experto</div><div><i></i>Aclaración de firma</div></div></section>' +
      '<p class="nota f-ref">Referencias: Aiken, L. R. (1985). Three coefficients for analyzing the reliability and validity of ratings. <i>Educational and Psychological Measurement, 45</i>(1), 131–142. Escobar-Pérez, J. y Cuervo-Martínez, Á. (2008). Validez de contenido y juicio de expertos: una aproximación a su utilización. <i>Avances en Medición, 6</i>, 27–36.</p>';
    app.innerHTML = h + '<div class="acciones no-imp"><button class="btn sec" data-ir="expertos">← Investigación</button><span class="espacio"></span><button class="btn pri" id="imp">Imprimir</button></div></main>';
    enlazar(); $('#imp').onclick = function () { window.print(); };
  }

  /* ================================================================ pantalla del stand */
  var DATOS_VERIFICADOS = [
    ['Responder las reseñas', 'Los hoteles que empezaron a responder sus reseñas subieron en promedio 0,12 estrellas y recibieron 12 % más reseñas.', 'Proserpio y Zervas, 2017'],
    ['Ser encontrado en Google', 'Google indica que la cantidad de reseñas y la calificación influyen en la posición de un negocio en los resultados locales.', 'Google, s. f.'],
    ['Bolivia en redes', 'En octubre de 2025 había 9,43 millones de identidades de usuario en redes sociales en Bolivia, el 74,7 % de la población.', 'Kemp, 2025'],
    ['Pequeñas empresas', 'En un estudio de 365 pequeñas empresas de Bogotá, el 86,4 % no hacía acciones de posicionamiento en buscadores.', 'Uribe Beltrán y Sabogal Neira, 2021']];
  function vStand() {
    document.body.classList.add('oscuro'); var giro = 0, vistos = {};
    leer().evals.forEach(function (e) { vistos[e.id] = 1; });
    vStand.nuevo = function () {
      var nuevos = leer().evals.filter(function (e) { return !vistos[e.id]; }); nuevos.forEach(function (e) { vistos[e.id] = 1; });
      pintar(); var e = nuevos.filter(function (x) { return x.origen === 'Feria'; }).pop(); if (!e) return;
      var p = puntajes(e.resp), nv = nivelDe(p.indice), ov = document.createElement('div'); ov.className = 'st-nuevo';
      ov.innerHTML = '<div><span>¡Nuevo diagnóstico!</span><b>' + esc(rubroTexto(e)) + '</b>' + anillo(p.indice, 'de 100', true) + '<em class="pill-n n' + nv.k + '">Nivel ' + nv.n.nombre + '</em>' +
        (e.estimacion != null ? '<p>El dueño creía tener <b>' + e.estimacion + '</b></p>' : '') + '</div>';
      document.body.appendChild(ov); setTimeout(function () { ov.classList.add('fuera'); setTimeout(function () { ov.remove(); }, 600); }, 9000);
    };
    function pintar() {
      var db = leer(), est0 = unaPorNegocio(estudio(db)), feria = db.evals.filter(function (e) { return e.origen === 'Feria'; }).sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; }), deFeria = est0.length < 3, est = deFeria ? feria : est0, ref = referencia(est);
      var P = est.map(function (e) { return puntajes(e.resp); }), cuenta = [0, 0, 0, 0]; P.forEach(function (p) { if (p.indice != null) cuenta[nivelDe(p.indice).k]++; });
      var brechas = ITEMS.map(function (it) { var v = est.map(function (e) { return e.resp[it.id]; }).filter(ok); return { it: it, cero: v.length ? v.filter(function (x) { return x === 0; }).length / v.length * 100 : -1 }; }).sort(function (a, b) { return b.cero - a.cero; }).slice(0, 3);
      var dato = DATOS_VERIFICADOS[giro++ % DATOS_VERIFICADOS.length];
      var conEst = feria.filter(function (e) { return e.estimacion != null; }), mCree = media(conEst.map(function (e) { return e.estimacion; })), mReal = media(conEst.map(function (e) { return puntajes(e.resp).indice; }));
      var percep = conEst.length ? '<div class="st-percep"><span>Lo que creen los dueños vs. lo que ve el cliente</span><div><div><small>Creen tener</small><b>' + f0(mCree) + '</b></div><div><small>Presencia real</small><b>' + f0(mReal) + '</b></div><div><small>Diferencia</small><b class="' + (mReal < mCree ? 'menos' : 'mas') + '">' + (mReal - mCree > 0 ? '+' : '') + f0(mReal - mCree) + '</b></div></div><small>' + conEst.length + (conEst.length === 1 ? ' negocio' : ' negocios') + ' de la Feria</small></div>' : '';
      var prueba = dePrueba(db).length ? '<span class="st-prueba">Datos de prueba</span>' : '';
      if (!ref) {
        app.innerHTML = '<div class="stand st-atrae"><header><div class="marca">' + LOGO_BLANCO + '<small>Universidad Amazónica de Pando<br>Ingeniería Comercial · Marketing Digital</small></div><div class="st-acc">' + prueba + '<button id="fs">Pantalla completa</button><button data-ir="inicio">Salir</button></div></header>' +
          '<div class="at-g"><section class="at-hero"><span class="at-eye">Diagnóstico gratuito de presencia digital</span><h1>¿Tu negocio aparece cuando un cliente lo busca?</h1>' +
          '<p>En pocos minutos revisamos lo que un cliente ve de tu negocio en Google, en las redes sociales y en la inteligencia artificial.</p>' +
          '<div class="at-pasos"><div><i>1</i><b>Dinos el nombre de tu negocio</b></div><div><i>2</i><b>Revisamos 21 indicadores</b></div><div><i>3</i><b>Llévate tu nivel, tu plan y tu kit</b></div></div>' +
          '<div class="at-cta">Pide tu diagnóstico aquí 👇</div>' + (feria.length ? '<div class="at-cuenta"><b>' + feria.length + '</b> ' + (feria.length === 1 ? 'negocio ya pidió su diagnóstico' : 'negocios ya pidieron su diagnóstico') + ' en la Feria</div>' : '') + '</section>' +
          '<section class="at-dims"><span>Las 7 dimensiones de Marki</span>' + DIMS.map(function (d, i) { return '<div style="--i:' + i + '"><em>' + d.id + '</em><b>' + esc(d.nombre) + '</b><small>' + esc(d.pregunta) + '</small></div>'; }).join('') + '</section></div>' +
          '<section class="st-dato at-dato"><span>¿Sabías que…?</span><b>' + esc(dato[0]) + '</b><p>' + esc(dato[1]) + '</p><small>' + esc(dato[2]) + '</small></section></div>';
        enlazar(); var bf = document.getElementById('fs'); if (bf) bf.onclick = function () { try { document.documentElement.requestFullscreen(); } catch (e) {} };
        return;
      }
      app.innerHTML = '<div class="stand st-datos"><header><div class="marca">' + LOGO_BLANCO + '<small>Universidad Amazónica de Pando<br>Ingeniería Comercial · Marketing Digital</small></div><div class="st-acc">' + prueba + '<button id="fs">Pantalla completa</button><button data-ir="inicio">Salir</button></div></header>' +
        '<div class="st-grid"><section class="st-big"><span>' + (deFeria ? '¿Cómo está la presencia digital de los negocios que visitaron el stand?' : '¿Cómo está la presencia digital de Cobija?') + '</span>' + (ref ? '<div class="st-ring">' + anillo(ref.indice, 'índice promedio', true) + '<div><b>' + ref.n + (deFeria ? '</b> ' + (ref.n === 1 ? 'negocio diagnosticado' : 'negocios diagnosticados') + ' en la Feria' : '</b> negocios evaluados en el estudio<br><b>' + feria.length + '</b> ' + (feria.length === 1 ? 'diagnóstico' : 'diagnósticos') + ' en la Feria') + (feria.filter(function (e) { return hoy(e.fecha); }).length ? ' · <b>' + feria.filter(function (e) { return hoy(e.fecha); }).length + '</b> hoy' : '') + '</div></div>' + radarSVG(ref.dims, null, { oscuro: true, w: 420, h: conEst.length ? 300 : 340 }) + percep : '<p class="st-vacio">Los resultados aparecerán aquí cuando el estudio tenga al menos 3 negocios evaluados.</p>') + '<div class="st-pide">¿Y tu negocio? Pide tu diagnóstico gratis aquí 👇</div></section>' +
        '<section><h3>' + (deFeria ? 'Lo que más falta en los negocios diagnosticados' : 'Lo que más falta en Cobija') + '</h3><ol class="st-brechas">' + (brechas[0] && brechas[0].cero > 0 ? brechas.filter(function (b) { return b.cero > 0; }).map(function (b) { return '<li><b>' + f0(b.cero) + ' %</b><span>' + esc(b.it.nombre) + '<small>negocios con 0 puntos</small></span></li>'; }).join('') : brechas[0] && brechas[0].cero === 0 ? '<li><span>Ningún indicador está en 0 en los negocios diagnosticados</span></li>' : '<li><span>Sin datos todavía</span></li>') + '</ol>' +
        (P.length ? '<h3>Niveles</h3>' : '') + '<div class="dist">' + cuenta.map(function (n, i) { return n ? '<div style="flex:' + n + ';background:' + COL_T[i] + '">' + R.niveles[i].nombre + ' · ' + n + '</div>' : ''; }).join('') + '</div>' +
        '<h3>Últimos diagnósticos en la Feria</h3><ul class="st-ult">' + (feria.length ? feria.slice(0, 3).map(function (e) { var p = puntajes(e.resp), nv = nivelDe(p.indice); return '<li><span>' + esc(rubroTexto(e)) + '</span><b class="pill-n n' + nv.k + '">' + nv.n.nombre + ' · ' + f0(p.indice) + '</b></li>'; }).join('') : '<li><span>Todavía no hay diagnósticos. ¡Acércate y evalúa tu marca!</span></li>') + '</ul></section>' +
        (giro % 3 === 0 ? '<section class="st-dato st-como"><span>¿Cómo funciona Marki?</span><ol><li><b>Buscamos tu negocio</b> en Google, redes sociales e IA, como lo haría un cliente.</li><li><b>Calificamos 21 indicadores</b> con criterios fijos y evidencia pública.</li><li><b>Te llevas tu nivel, tu plan y tu kit</b> con códigos QR. ¡Pide tu diagnóstico gratis!</li></ol></section>'
          : '<section class="st-dato"><span>¿Sabías que…?</span><b>' + esc(dato[0]) + '</b><p>' + esc(dato[1]) + '</p><small>' + esc(dato[2]) + '</small></section>') + '</div></div>';
      enlazar(); var b = document.getElementById('fs'); if (b) b.onclick = function () { try { document.documentElement.requestFullscreen(); } catch (e) {} };
    }
    pintar(); timerStand = setInterval(pintar, 8000);
  }

  /* ================================================================ datos: importar y exportar */
  function confirmar(b) { if (b.dataset.ok) return true; b.dataset.ok = 1; var t = b.textContent; b.textContent = 'Toca otra vez para confirmar'; setTimeout(function () { if (b.isConnected) { delete b.dataset.ok; b.textContent = t; } }, 3000); return false; }
  function importar(txt) {
    try { var j = JSON.parse(txt), lista = j.evals || j, db = leer(), ids = {}, n = 0; if (!Array.isArray(lista)) throw new Error('formato');
      db.evals.forEach(function (e) { ids[e.id] = 1; }); lista.forEach(function (e) { if (e && e.id && e.resp && !ids[e.id]) { db.evals.push(e); ids[e.id] = 1; n++;
        var fd = j.fotos && j.fotos[e.id]; if (e.foto && typeof fd === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(fd)) fotoGuardar(e.id, fd); } });
      escribir(db); aviso((n === 1 ? 'Se importó 1 evaluación nueva.' : 'Se importaron ' + n + ' evaluaciones nuevas.'), 'okk'); vPanel(); } catch (e) { aviso('El archivo no es un respaldo válido de Marki.', 'err'); }
  }
  function celda(c) { c = c == null ? '' : String(c); return /[",;\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }
  function csv(rows) { return '﻿' + rows.map(function (r) { return r.map(celda).join(','); }).join('\n'); }
  function r1(x) { return x == null ? '' : Math.round(x * 10) / 10; }
  function r2(x) { return x == null ? '' : Math.round(x * 100) / 100; }
  function csvAncho(evs) { return csv(tablaAncho(evs)); }
  function tablaAncho(evs) {
    var c0 = ['id', 'fecha', 'origen', 'codigo_negocio', 'negocio', 'rubro', 'red_principal', 'seguidores', 'evaluador', 'consentimiento', 'version_rubrica', 'indicadores_evaluados', 'indicadores_calculados', 'indice', 'nivel']
      .concat(DIMS.map(function (d) { return d.id + '_' + slug(d.corto); })).concat(ITEMS.map(function (it) { return 'i' + it.id.replace('.', '_'); }))
      .concat(['dato_resenas', 'dato_calificacion', 'dato_publicaciones_30d', 'dato_formatos', 'dato_respuesta_min', 'dato_ficha']).concat(LINKS.map(function (l) { return 'enlace_' + l[0]; })).concat(['enlace_whatsapp', 'estimacion_dueno', 'rubro_detalle', 'decididos_por_marki', 'observaciones', 'google_place_id', 'google_resenas', 'google_calificacion', 'google_fecha', 'dueno_describe_bien', 'dueno_acciones_utiles', 'dueno_aplicara']);
    return [c0].concat(evs.map(function (e) { var p = puntajes(e.resp), nv = nivelDe(p.indice), d = e.datos || {}, L = e.links || {};
      return [e.id, e.fecha, e.origen, e.codigo, e.nombre, e.rubro, e.red, e.seguidores == null ? '' : e.seguidores, e.evaluador, e.consentimiento == null ? '' : (e.consentimiento ? 'si' : 'no'), e.version || '', p.evaluados,
        Object.keys(e.auto || {}).filter(function (k) { return e.auto[k]; }).length, r1(p.indice), nv ? nv.n.nombre : '']
        .concat(DIMS.map(function (dd) { return r1(p.dims[dd.id]); })).concat(ITEMS.map(function (it) { var v = e.resp[it.id]; return ok(v) ? v : 'NA'; }))
        .concat([d.resenas, d.calificacion, d.posts30, (d.formatos || []).join('; '), d.respuesta_min, (d.ficha || []).join('; ')]).concat(LINKS.map(function (l) { return L[l[0]] || ''; })).concat([L.whatsapp || '', e.estimacion == null ? '' : e.estimacion, e.rubroDetalle || '', Object.keys(e.auto || {}).filter(function (k) { return e.auto[k]; }).length,
        JSON.stringify(Object.keys(e.datos || {}).filter(function (k) { return k.indexOf('p_') === 0 || k === 'rev9'; }).reduce(function (o, k) { o[k] = e.datos[k]; return o; }, {}))]).concat(e.google ? [e.google.id, e.google.n, e.google.rating, e.google.fecha] : ['', '', '', '']).concat(e.devolucion ? [e.devolucion.q1 || '', e.devolucion.q2 || '', e.devolucion.q3 || ''] : ['', '', '']); }));
  }
  function csvLargo(evs) { return csv(filasLargo(evs)); }
  /* v9.8 · Excel (.xlsx) hecho aquí mismo, sin internet ni librerías: un .zip (sin compresión) con las hojas en XML */
  var CRC_T = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zipSinCompresion(archivos) {
    var enc = new TextEncoder(), partes = [], central = [], pos = 0, d = new Date(), hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dia = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    function u16(v) { return [v & 255, (v >>> 8) & 255]; } function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    archivos.forEach(function (f) {
      var nom = enc.encode(f[0]), dat = enc.encode(f[1]), crc = crc32(dat);
      var loc = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(hora), u16(dia), u32(crc), u32(dat.length), u32(dat.length), u16(nom.length), u16(0));
      partes.push(new Uint8Array(loc), nom, dat);
      central.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(hora), u16(dia), u32(crc), u32(dat.length), u32(dat.length), u16(nom.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(pos))), nom);
      pos += loc.length + nom.length + dat.length;
    });
    var tamC = central.reduce(function (a, x) { return a + x.length; }, 0);
    var fin = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(archivos.length), u16(archivos.length), u32(tamC), u32(pos), u16(0)));
    return new Blob(partes.concat(central).concat([fin]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function xmlTxt(v) { return String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').slice(0, 32000); }
  function colLetra(n) { var s = ''; n++; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
  /* hojas = [{ nombre, filas: [[...]], anchos: [..] }]; la primera fila de cada hoja es el encabezado */
  function libroExcel(hojas) {
    var arch = [], ws = '';
    hojas.forEach(function (h, i) {
      var filas = h.filas, nc = filas.reduce(function (a, f) { return Math.max(a, f.length); }, 1);
      var cols = '<cols>' + Array.apply(null, Array(nc)).map(function (_, c) { var w = (h.anchos && h.anchos[c]) || Math.min(60, Math.max(10, filas.slice(0, 200).reduce(function (a, f) { return Math.max(a, String(f[c] == null ? '' : f[c]).length * (f === filas[0] ? 1.05 : 1.1)); }, 0) + 2));
        return '<col min="' + (c + 1) + '" max="' + (c + 1) + '" width="' + Math.round(w) + '" customWidth="1"/>'; }).join('') + '</cols>';
      var datos = filas.map(function (f, r) { return '<row r="' + (r + 1) + '">' + f.map(function (v, c) { var ref = colLetra(c) + (r + 1), st = r === 0 ? ' s="1"' : (h.envolver && h.envolver.indexOf(c) >= 0 ? ' s="2"' : '');
        if (v === null || v === undefined || v === '') return r === 0 ? '<c r="' + ref + '"' + st + '/>' : '';
        if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"' + st + '><v>' + v + '</v></c>';
        return '<c r="' + ref + '" t="inlineStr"' + st + '><is><t xml:space="preserve">' + xmlTxt(v) + '</t></is></c>'; }).join('') + '</row>'; }).join('');
      arch.push(['xl/worksheets/sheet' + (i + 1) + '.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"' + (i === 0 ? ' tabSelected="1"' : '') + '><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' + cols + '<sheetData>' + datos + '</sheetData>' + (filas.length > 1 ? '<autoFilter ref="A1:' + colLetra(nc - 1) + filas.length + '"/>' : '') + '</worksheet>']);
      ws += '<sheet name="' + xmlTxt(h.nombre.slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>';
    });
    var dn = hojas.map(function (h, i) { var f = h.filas, nc = f.reduce(function (a, x) { return Math.max(a, x.length); }, 1); return f.length > 1 ? '<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">\'' + xmlTxt(h.nombre.slice(0, 31)).replace(/'/g, "''") + '\'!$A$1:$' + colLetra(nc - 1) + '$' + f.length + '</definedName>' : ''; }).join('');
    arch.unshift(
      ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + hojas.map(function (_, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>'],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + ws + '</sheets>' + (dn ? '<definedNames>' + dn + '</definedNames>' : '') + '</workbook>'],
      ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + hojas.map(function (_, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') + '<Relationship Id="rId' + (hojas.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F3864"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>']);
    return zipSinCompresion(arch);
  }
  /* qué significa cada columna: el Excel usa nombres legibles y la hoja de Google y el CSV usan el código */
  function diccionarioColumnas() {
    var base = { id: 'Identificador único de la evaluación', fecha: 'Fecha y hora en que se guardó. En este Excel va en la hora del equipo; en la hoja de Google y en el CSV va en hora universal (UTC), 4 horas más que en Bolivia', origen: 'Estudio (muestra de la investigación) o Feria (diagnóstico hecho en la Feria)', codigo_negocio: 'Código del negocio, para juntar dos evaluaciones del mismo negocio', negocio: 'Nombre del negocio', rubro: 'Rubro', red_principal: 'Red social principal del negocio', seguidores: 'Seguidores en la red principal', evaluador: 'Código del evaluador (solo en la muestra del estudio)', consentimiento: 'El responsable aceptó que se use el diagnóstico (si o no)', version_rubrica: 'Versión de la rúbrica usada', indicadores_evaluados: 'Cuántos de los 21 indicadores se pudieron calificar', indicadores_calculados: 'Cuántos indicadores calculó Marki con los datos ingresados', indice: 'Índice de presencia digital, de 0 a 100 (promedio de las 7 dimensiones)', nivel: 'Nivel según el índice',
      dato_resenas: 'Número de reseñas en Google Maps', dato_calificacion: 'Calificación promedio en Google Maps (1 a 5)', dato_publicaciones_30d: 'Publicaciones en los últimos 30 días en la red principal', dato_formatos: 'Formatos usados en las publicaciones', dato_respuesta_min: 'Minutos que tardó en responder un mensaje', dato_ficha: 'Datos que tiene completos la ficha de Google', enlace_whatsapp: 'Número o enlace de WhatsApp', estimacion_dueno: 'Puntaje que el dueño creía tener antes de ver el diagnóstico (0 a 100)', rubro_detalle: 'Detalle del rubro si se eligió «Otro»', decididos_por_marki: 'Cuántos indicadores decidió Marki con las preguntas guiadas', observaciones: 'Respuestas de las preguntas guiadas (texto técnico, para revisión)', google_place_id: 'Identificador del lugar en Google Maps (si se usó la búsqueda automática)', google_resenas: 'Reseñas según la búsqueda automática de Google', google_calificacion: 'Calificación según la búsqueda automática de Google', google_fecha: 'Fecha de la búsqueda automática', dueno_describe_bien: 'Opinión del dueño: ¿el diagnóstico describe bien su negocio? (1 a 5)', dueno_acciones_utiles: 'Opinión del dueño: ¿las acciones recomendadas son útiles? (1 a 5)', dueno_aplicara: 'Opinión del dueño: ¿aplicará alguna acción? (si, tal vez, no)' };
    var corto = { id: 'ID', fecha: 'Fecha y hora', origen: 'Origen', codigo_negocio: 'Código del negocio', negocio: 'Negocio', rubro: 'Rubro', red_principal: 'Red principal', seguidores: 'Seguidores', evaluador: 'Evaluador', consentimiento: 'Consentimiento', version_rubrica: 'Versión de la rúbrica', indicadores_evaluados: 'Indicadores evaluados', indicadores_calculados: 'Indicadores calculados', indice: 'Índice (0-100)', nivel: 'Nivel', dato_resenas: 'Reseñas en Google', dato_calificacion: 'Calificación en Google', dato_publicaciones_30d: 'Publicaciones en 30 días', dato_formatos: 'Formatos', dato_respuesta_min: 'Respuesta (minutos)', dato_ficha: 'Datos de la ficha', enlace_whatsapp: 'WhatsApp', estimacion_dueno: 'Puntaje que creía el dueño', rubro_detalle: 'Detalle del rubro', decididos_por_marki: 'Decididos por Marki', observaciones: 'Preguntas guiadas', google_place_id: 'Google: ID del lugar', google_resenas: 'Google: reseñas', google_calificacion: 'Google: calificación', google_fecha: 'Google: fecha', dueno_describe_bien: 'Dueño: describe bien', dueno_acciones_utiles: 'Dueño: acciones útiles', dueno_aplicara: 'Dueño: aplicará' };
    var m = {};
    Object.keys(base).forEach(function (k) { m[k] = [corto[k], base[k]]; });
    DIMS.forEach(function (d) { m[d.id + '_' + slug(d.corto)] = [d.id + ' ' + d.corto + ' (%)', 'Puntaje de la dimensión ' + d.id + ' · ' + d.nombre + ', de 0 a 100']; });
    ITEMS.forEach(function (it) { m['i' + it.id.replace('.', '_')] = [it.id + ' ' + it.nombre, 'Respuesta del indicador ' + it.id + ' · ' + it.nombre + ': 0 = ' + it.n[0] + ' | 1 = ' + it.n[1] + ' | 2 = ' + it.n[2] + ' | NA = no se pudo evaluar']; });
    LINKS.forEach(function (l) { m['enlace_' + l[0]] = ['Enlace ' + l[1], 'Enlace revisado de ' + l[1]]; });
    return m;
  }
  function filasLargo(evs) {
    var rows = [['id', 'fecha', 'origen', 'codigo_negocio', 'negocio', 'rubro', 'evaluador', 'dimension', 'indicador', 'nombre_indicador', 'puntaje', 'calculado_con_datos', 'nota_dimension']];
    evs.forEach(function (e) { ITEMS.forEach(function (it) { var v = e.resp[it.id];
      rows.push([e.id, e.fecha, e.origen, e.codigo, e.nombre, e.rubro, e.evaluador, it.dim, it.id, it.nombre, ok(v) ? v : 'NA', (e.auto || {})[it.id] ? 'si' : 'no', (e.notas || {})[it.dim] || '']); }); });
    return rows;
  }
  /* el libro completo: evaluaciones (una fila por negocio), respuestas (una fila por indicador), expertos y el diccionario */
  function descargarExcel() {
    var db = leer(), evs = db.evals, dic = diccionarioColumnas(), ancho = tablaAncho(evs), cods = ancho[0];
    var fLocal = function (iso) { var d = new Date(iso); if (isNaN(d)) return iso || ''; var z = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes()); };
    var ev1 = [cods.map(function (c) { return (dic[c] || [c])[0]; })].concat(ancho.slice(1).map(function (r) { r = r.slice(); r[1] = fLocal(r[1]); return r; }));
    var largo = filasLargo(evs), lr = [['ID', 'Fecha y hora', 'Origen', 'Código del negocio', 'Negocio', 'Rubro', 'Evaluador', 'Dimensión', 'Indicador', 'Nombre del indicador', 'Puntaje (0-2)', 'Respuesta elegida', 'Calculado por Marki', 'Nota de la dimensión']]
      .concat(largo.slice(1).map(function (r) { var it = ITEM[r[8]], v = r[10]; r = r.slice(); r[1] = fLocal(r[1]); return r.slice(0, 11).concat([v === 'NA' ? 'No se pudo evaluar' : it.n[v]]).concat(r.slice(11)); }));
    var hojas = [{ nombre: 'Evaluaciones', filas: ev1 }, { nombre: 'Respuestas por indicador', filas: lr, envolver: [11, 13], anchos: [16, 18, 9, 22, 28, 26, 10, 10, 10, 30, 12, 60, 12, 40] }];
    var A = datosAiken(db), nums = []; A.ids = A.ids || {}; for (var e0 = 1; e0 <= Math.max(A.n || 5, 20); e0++) { if (A.nombres[e0] || A.ids[e0] || ITEMS.some(function (it) { return (A.r[it.id] || {})[e0] || (A.c[it.id] || {})[e0]; })) nums.push(e0); }
    if (nums.length) { var N0 = nums[nums.length - 1], cA = []; for (var k0 = 1; k0 <= N0; k0++) cA.push('Relevancia E' + k0, 'Claridad E' + k0);
      hojas.push({ nombre: 'V de Aiken', filas: [['Indicador', 'Nombre'].concat(cA).concat(['V relevancia', 'IC 95 % inferior', 'IC 95 % superior', 'V claridad', 'Decisión'])].concat(filasAiken(A).map(function (f) { var v = []; for (var k = 1; k <= N0; k++) v.push((A.r[f.it.id] || {})[k] || '', (A.c[f.it.id] || {})[k] || '');
        return [f.it.id, f.it.nombre].concat(v).concat(f.r ? [r2(f.r.V), r2(f.r.li), r2(f.r.ls)] : ['', '', '']).concat([f.c ? r2(f.c.V) : '', f.dec[1]]); })) });
      var tx = tablaExpertos(A, nums); hojas.push({ nombre: 'Expertos', filas: [tx[0].map(function (c) { var m0 = /^(relevancia|claridad)_(.+)$/.exec(c); return m0 ? (m0[1] === 'relevancia' ? 'Relevancia ' : 'Claridad ') + m0[2] : c === 'nombre_profesion' ? 'Nombre y profesión' : c === 'experto' ? 'Experto' : c === 'id' ? 'ID' : c.replace('suficiencia_', 'Suficiencia ').replace('comentario_', 'Comentario '); })].concat(tx.slice(1)) }); }
    hojas.push({ nombre: 'Diccionario', filas: [['Columna en este Excel', 'Columna en la hoja de Google y en el CSV', 'Qué significa']].concat(cods.map(function (c) { return [(dic[c] || [c])[0], c, (dic[c] || ['', ''])[1]]; })).concat([['Registro completo', 'registro_marki', 'Solo en la hoja de Google: la evaluación completa en formato técnico (JSON), que usan el stand y el docente para traerla. No la edites.'], ['Recibido', 'recibido', 'Solo en la hoja de Google: fecha y hora en que llegó la evaluación']]), envolver: [2], anchos: [30, 30, 100] });
    var b = libroExcel(hojas), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'marki_datos_' + new Date().toISOString().slice(0, 10) + '.xlsx'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    aviso('Excel descargado: ' + pl(evs.length, 'evaluación', 'evaluaciones') + (nums.length ? ' y ' + pl(nums.length, 'experto', 'expertos') : '') + '.', 'okk');
  }
  function descargar(nombre, contenido) { var b = new Blob([contenido], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }

  window.RADAR = { puntajes: puntajes, icc21: icc21, kappaW: kappaW, spearman: spearman, friedman: friedman, nivelDe: nivelDe, autoNivel: autoNivel, ITEM: ITEM, pdf: pdfDiagnostico, tabla: tablaAncho }; /* pdf y tabla: solo para las pruebas automáticas */
  function ruta() {
    var h0 = location.hash.slice(1).split('/'), v = h0[0], arg = h0[1];
    if ((v === 'informe' || v === 'kit') && arg) return ir(v, arg, true);
    ir(['panel', 'nueva', 'expertos', 'experto', 'stand', 'formulario', 'config', 'preparar'].indexOf(v) >= 0 ? v : 'inicio', null, true);
  }
  window.addEventListener('popstate', ruta); /* también se dispara al cambiar el # a mano */
  window.addEventListener('storage', function (e) { if (e.key === CLAVE && document.body.classList.contains('oscuro') && vStand.nuevo) vStand.nuevo(); });
  /* se espera un momento a que carguen las fotos del lugar, para que el diagnóstico las muestre desde el inicio */
  Promise.race([fotosCargar(), new Promise(function (ok) { setTimeout(ok, 700); })]).then(ruta);
  setTimeout(subir, 1500);
})();
