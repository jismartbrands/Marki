/* Marki · analizador de datos de entrada (versión 1)
   El evaluador pega o escribe datos; estas funciones los leen y responden las preguntas de observación.
   Todo es local (sin internet) y transparente: cada detección muestra la palabra o el patrón que la activó. */
(function () {
  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }

  /* ---------- 1. Publicaciones: precio, llamado a la acción, promoción, promoción medible y contenido de valor */
  var PATRONES = {
    precio: { nombre: 'Precio', re: [/\bbs\.?\s?\d/, /\d+(?:[.,]\d+)?\s?(?:bs|bolivianos)\b/, /\$\s?\d/, /\d+(?:[.,]\d+)?\s?(?:\$|usd|reales|r\$)/, /\bprecios?\s*(?:de|:|desde)?\s*\d/, /\ba solo\s*\d/, /\bdesde\s*\d+\s*(?:bs|\$)/] },
    accion: { nombre: 'Cómo comprar', re: [/\bescrib[ei]\w*/, /\bwhats\s?app\b/, /\bwsp\b|\bwpp\b|wa\.me/, /\bllam[ae]\w*/, /\breserv\w*/, /\bpid[ea]\w*|\bpedido\w*/, /\bvisit\w*/, /\bte esperamos\b|\blos esperamos\b/, /\bacerca\w*|\bven(?:i|ga)?\w* a\b/, /\bcompra (?:ya|aqui|ahora)\b/, /\bdelivery\b|\benvios?\b|\ba domicilio\b/, /\bcontact\w*/, /\bconsult\w*/, /\binbox\b|\bmensaje\b|\bdm\b/, /\blink en (?:la )?bio\b/, /\bubicad[oa]s? en\b|\bdireccion\b/, /\b[67]\d{7}\b/, /\b[67]\d{2}[ -]\d{5}\b/] },
    promo: { nombre: 'Promoción', re: [/\bpromo\w*/, /\bdescuento\w*/, /\boferta\w*/, /\b2\s?x\s?1\b|\b3\s?x\s?2\b/, /\d+\s?%/, /\brebaj\w*/, /\bliquidacion\b/, /\bsorteo\b/, /\bgratis\b/, /\bcombo\w*/, /\bhappy hour\b/, /\bblack friday\b|\bcyber\b/] },
    medible: { nombre: 'Promoción medible', re: [/\bcodigo\b/, /\bcupon\w*/, /\bpalabra (?:clave|secreta|magica)\b/, /\bcon la palabra\b|\bdi(?:nos|les)? la palabra\b|\bmenciona (?:la palabra|esta|este)\b/, /\bmuestra (?:esta|este) (?:publicacion|post|imagen|video|historia)\b/, /\bpresenta(?:ndo)? (?:esta|este) (?:publicacion|post|imagen)\b/, /\bsolo (?:por|para) (?:seguidores|redes)\b/] },
    valor: { nombre: 'Aporta valor', re: [/\bconsejo\w*/, /\btips?\b/, /\bcomo (?:hacer|preparar|usar|cuidar|elegir)\b/, /\breceta\w*/, /\bsabias que\b/, /\btestimonio\w*/, /\bnuestro equipo\b|\bconoce a\b|\bte presentamos a\b/, /\bdetras de (?:camaras|escena)\b/, /\bproceso\b|\basi (?:preparamos|hacemos|elaboramos)\b/, /\bclientes? (?:feliz|felices|contento|contentos|satisfech)\w*/, /\bnuestr[oa]s? (?:cociner[oa]s?|chef|equipo|personal|panader[oa]s?|barista|estilistas?|mecanic[oa]s?|profesor\w*|doctor\w*|entrenador\w*|guias?|fundador\w*)\b/, /\bcumple\w* \d+ anos con nosotros\b|\bconocelo\b|\bconocela\b/, /\bpaso a paso\b|\btutorial\b|\baprende\b/, /\bnuestra historia\b|\baniversario\b/] }
  };
  /* «precio por interno» no cuenta como precio publicado */
  var SIN_PRECIO = /precio\w* (?:por|al) (?:interno|inbox|privado|dm)|consult\w* precio|precio a consultar/;
  function analizarPost(texto) {
    var t = norm(texto), out = {};
    Object.keys(PATRONES).forEach(function (k) { var hit = null; PATRONES[k].re.some(function (r) { var m = t.match(r); if (m) { hit = m[0]; return true; } return false; }); out[k] = hit; });
    if (out.precio && SIN_PRECIO.test(t) && !/\bbs\.?\s?\d|\d+\s?bs\b/.test(t)) out.precio = null;
    if (!out.precio && SIN_PRECIO.test(t)) out.precioInterno = true;
    if (out.medible && !out.promo) out.promo = out.medible;
    return out;
  }
  function analizarPublicaciones(lista) {
    var posts = (lista || []).filter(function (x) { return norm(x).length > 2; }), A = posts.map(analizarPost);
    var c = function (k) { return A.filter(function (a) { return a[k]; }).length; };
    return { n: posts.length, detalle: A, precio: c('precio'), accion: c('accion'), promo: c('promo'), medible: c('medible'), valor: c('valor'), interno: c('precioInterno') };
  }

  /* ---------- 2. Teléfono, dirección y horario en cada canal */
  function digitos(t) { var d = String(t || '').replace(/\D/g, ''); return d.length >= 8 ? d.slice(-8) : d; }
  var ABREV = [[/\bav\.?\b/g, 'avenida'], [/\bc\/\s?/g, 'calle '], [/\bcalle\b/g, 'calle'], [/\bbarrio\b|\bb\/\s?/g, 'barrio '], [/\bnro\.?\b|\bn°|#/g, ' '], [/\besq\.?\b/g, 'esquina'], [/\bfrente a\b/g, 'frente']];
  var VACIAS = { de: 1, la: 1, el: 1, y: 1, en: 1, a: 1, del: 1, los: 1, las: 1, cobija: 1, pando: 1, bolivia: 1, entre: 1, 'n': 1 };
  function palabras(dir) { var t = norm(dir); ABREV.forEach(function (a) { t = t.replace(a[0], a[1]); });
    return t.replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(function (w) { return w && !VACIAS[w]; }); }
  function parecido(a, b) { var A = palabras(a), B = palabras(b); if (!A.length || !B.length) return 1;
    var inter = A.filter(function (w) { return B.indexOf(w) >= 0; }).length; return inter / Math.min(A.length, B.length); }
  function horas(t) { var s = norm(t).replace(/(\d{1,2})\s?(?:hrs?|h)\b/g, '$1:00'), m = s.match(/\d{1,2}[:.]\d{2}|\d{1,2}\s?(?:am|pm)/g) || [];
    return m.map(function (x) { var pm = /pm/.test(x), am = /am/.test(x), p = x.replace(/[^0-9:.]/g, '').split(/[:.]/), h = +p[0], mi = p[1] || '00';
      if (pm && h < 12) h += 12; if (am && h === 12) h = 0; return h + ':' + mi; }).sort().join(' '); }
  function compararCanales(tabla) {
    /* tabla: { canal: { tel, dir, hor } } ; se comparan solo los canales donde se escribió algo */
    var canales = Object.keys(tabla || {}).filter(function (k) { var r = tabla[k] || {}; return (r.tel || r.dir || r.hor || '').trim(); });
    var R = { canales: canales.length, conflictos: [], faltan: [] };
    if (canales.length < 2) return R;
    [['tel', 'teléfono'], ['dir', 'dirección'], ['hor', 'horario']].forEach(function (c) {
      var con = canales.filter(function (k) { return (tabla[k][c[0]] || '').trim(); });
      canales.forEach(function (k) { if (!(tabla[k][c[0]] || '').trim()) R.faltan.push(c[1] + ' en ' + k); });
      for (var i = 0; i < con.length; i++) for (var j = i + 1; j < con.length; j++) {
        var a = tabla[con[i]][c[0]], b = tabla[con[j]][c[0]], dif = false;
        if (c[0] === 'tel') dif = digitos(a) && digitos(b) && digitos(a) !== digitos(b);
        if (c[0] === 'dir') dif = parecido(a, b) < 0.5;
        if (c[0] === 'hor') { var ha = horas(a), hb = horas(b); dif = ha && hb && ha !== hb; }
        if (dif) R.conflictos.push(c[1] + ': ' + con[i] + ' ≠ ' + con[j]);
      }
    });
    return R;
  }

  /* ---------- 3. Respuestas de ChatGPT: ¿menciona o reconoce al negocio? */
  var GENERICAS = { restaurante: 1, restaurant: 1, polleria: 1, pollos: 1, heladeria: 1, panaderia: 1, pasteleria: 1, cafeteria: 1, cafe: 1, hotel: 1, hostal: 1, tienda: 1, comercial: 1, importadora: 1, farmacia: 1, salon: 1, barberia: 1, gimnasio: 1, taller: 1, ferreteria: 1, la: 1, el: 1, los: 1, las: 1, de: 1, del: 1, y: 1, srl: 1, ltda: 1, cobija: 1, bolivia: 1, '&': 1, cia: 1 };
  var NO_SABE = /no (?:tengo|dispongo de|cuento con|encontre|encuentro|hay) (?:informacion|datos|registro)|no (?:conozco|puedo (?:encontrar|confirmar|verificar))|no estoy (?:seguro|al tanto)|no tengo conocimiento|no aparece en mi|no se de (?:un|una|ningun)|desconozco/;
  function menciona(nombre, texto) {
    var t = ' ' + norm(texto).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ') + ' ', n = norm(nombre).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!n || t.length < 3) return { si: false };
    if (t.indexOf(' ' + n + ' ') >= 0) return { si: true, por: nombre };
    var clave = n.split(' ').filter(function (w) { return w.length > 2 && !GENERICAS[w]; });
    if (!clave.length) return { si: false };
    var hallados = clave.filter(function (w) { return t.indexOf(' ' + w + ' ') >= 0; });
    var ok = clave.length === 1 ? hallados.length === 1 : hallados.length >= Math.ceil(clave.length * 2 / 3);
    return { si: ok, por: hallados.join(' ') };
  }
  function analizarIA(nombre, r1, r2) {
    var out = {};
    if (norm(r1).length > 10) { var m1 = menciona(nombre, r1); out.recomienda = m1.si; out.por1 = m1.por; }
    if (norm(r2).length > 10) { var m2 = menciona(nombre, r2), dudas = NO_SABE.test(norm(r2)); out.reconoce = m2.si && !dudas; out.dudas = dudas; out.por2 = m2.por; }
    return out;
  }

  window.MARKI_ANALIZADOR = { analizarPost: analizarPost, analizarPublicaciones: analizarPublicaciones, compararCanales: compararCanales, analizarIA: analizarIA, menciona: menciona, PATRONES: PATRONES, norm: norm };
})();
