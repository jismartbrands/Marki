/* Marki · redactor del diagnóstico (versión 1)
   Convierte lo que se observó de cada negocio en frases concretas: qué se vio (evidencia),
   qué hacer (acción con sus propios datos) y una lectura general del caso.
   Es un sistema de reglas transparente, sin internet: cada frase sale de un dato registrado.
   Si un dato no se registró, la frase se omite o se usa el texto general de la rúbrica. */
(function () {
  var A = window.MARKI_ANALIZADOR, R = window.RUBRICA;
  if (!A || !R) return;
  var norm = A.norm;

  /* ---------------------------------------------------------------- vocabulario por rubro */
  var V0 = { cat: 'tu lista de precios', verbo: 'Pide', cta: 'Escríbenos por WhatsApp', fotos: 'tus productos', video: 'cómo es tu producto o servicio por dentro',
    valor: 'cómo trabajas, quién atiende y qué dicen tus clientes', facil: 'el catálogo de WhatsApp Business y el pago con QR', saludo: 'tu pedido' };
  var VR = {
    'Restaurante o comida': { cat: 'tu menú con precios', verbo: 'Pide', cta: 'Pide por WhatsApp', fotos: 'tus platos', video: 'cómo se prepara un plato', valor: 'cómo preparan tus platos, quién cocina y qué dicen tus clientes', facil: 'el catálogo de WhatsApp con tu menú, el envío a domicilio o el pago con QR', saludo: 'tu pedido' },
    'Cafetería, heladería o panadería': { cat: 'tu carta con precios', verbo: 'Pide', cta: 'Pide por WhatsApp', fotos: 'tus productos recién hechos', video: 'decorando una torta o sirviendo un café', valor: 'cómo hornean, de dónde vienen los ingredientes y qué dicen tus clientes', facil: 'el catálogo de WhatsApp, los pedidos por encargo o el pago con QR', saludo: 'tu pedido' },
    'Bar o discoteca': { cat: 'tu carta de tragos con precios', verbo: 'Reserva', cta: 'Reserva tu mesa por WhatsApp', fotos: 'el ambiente y tus tragos', video: 'el ambiente de una noche o un trago preparándose', valor: 'quién prepara los tragos, los eventos que vienen y fotos de tus clientes', facil: 'las reservas de mesa por WhatsApp y el pago con QR', saludo: 'tu reserva' },
    'Hospedaje': { cat: 'tus tarifas por noche', verbo: 'Reserva', cta: 'Reserva por WhatsApp', fotos: 'tus habitaciones', video: 'un recorrido de 20 segundos por una habitación', valor: 'cómo son tus habitaciones, qué hay cerca y qué dicen tus huéspedes', facil: 'la reserva por WhatsApp con pago por QR', saludo: 'tu reserva' },
    'Turismo': { cat: 'tus paquetes con precios', verbo: 'Reserva', cta: 'Reserva tu tour por WhatsApp', fotos: 'tus destinos', video: 'un momento de uno de tus tours', valor: 'los lugares que visitan, quién guía y lo que cuentan tus viajeros', facil: 'la reserva por WhatsApp con pago por QR', saludo: 'tu reserva' },
    'Importadora o zona franca': { cat: 'tu catálogo con precios', verbo: 'Pide', cta: 'Cotiza por WhatsApp', fotos: 'tus productos', video: 'desempacando las novedades', valor: 'cómo elegir un producto, comparativas y qué dicen tus clientes', facil: 'el catálogo de WhatsApp, el envío o el pago con QR', saludo: 'tu compra' },
    'Ropa y calzado': { cat: 'tu catálogo con precios y tallas', verbo: 'Pide', cta: 'Pide tu talla por WhatsApp', fotos: 'tus prendas puestas', video: 'cómo combinar una prenda', valor: 'cómo combinar las prendas, las novedades y fotos de tus clientes', facil: 'el catálogo de WhatsApp con tallas, el envío o el pago con QR', saludo: 'tu compra' },
    'Tecnología': { cat: 'tu catálogo con precios', verbo: 'Pide', cta: 'Cotiza por WhatsApp', fotos: 'tus equipos', video: 'desempacando o probando un equipo', valor: 'consejos para elegir un equipo, comparativas y opiniones de tus clientes', facil: 'el catálogo de WhatsApp, la garantía escrita y el pago con QR', saludo: 'tu compra' },
    'Supermercado o abarrotes': { cat: 'tus ofertas de la semana con precios', verbo: 'Pide', cta: 'Haz tu pedido por WhatsApp', fotos: 'tus productos y ofertas', video: 'las novedades y ofertas de la semana', valor: 'ideas de recetas, productos nuevos y quién atiende', facil: 'los pedidos por WhatsApp, el envío a domicilio o el pago con QR', saludo: 'tu pedido' },
    'Farmacia o salud': { cat: 'tus servicios con precios', verbo: 'Agenda', cta: 'Consulta por WhatsApp', fotos: 'tu local y tu equipo', video: 'quién atiende y cómo es tu local', valor: 'quiénes atienden, los horarios de turno y consejos generales de cuidado', facil: 'la consulta por WhatsApp, la entrega a domicilio o el pago con QR', saludo: 'tu consulta' },
    'Belleza': { cat: 'tu lista de servicios con precios', verbo: 'Agenda', cta: 'Agenda tu cita por WhatsApp', fotos: 'tus trabajos terminados', video: 'un antes y después', valor: 'antes y después, quién atiende y los cuidados que recomiendan', facil: 'la agenda de citas por WhatsApp y el pago con QR', saludo: 'tu cita' },
    'Gimnasio o deporte': { cat: 'tus planes con precios', verbo: 'Inscríbete', cta: 'Inscríbete por WhatsApp', fotos: 'tu sala y tus clases', video: 'un ejercicio bien explicado', valor: 'rutinas, quiénes entrenan y los avances de tus socios', facil: 'la inscripción por WhatsApp y el pago con QR', saludo: 'tu inscripción' },
    'Educación': { cat: 'tus cursos con costos y horarios', verbo: 'Inscríbete', cta: 'Inscríbete por WhatsApp', fotos: 'tus clases', video: 'un minuto de una clase', valor: 'quién enseña, qué logran los estudiantes y un consejo útil del tema', facil: 'la inscripción por WhatsApp y el pago con QR', saludo: 'tu inscripción' },
    'Taller o repuestos': { cat: 'tus servicios y repuestos con precios', verbo: 'Agenda', cta: 'Cotiza por WhatsApp', fotos: 'tus trabajos y repuestos', video: 'una reparación rápida', valor: 'consejos de mantenimiento, el antes y después de una reparación y quién trabaja', facil: 'la cotización por WhatsApp y el pago con QR', saludo: 'tu servicio' },
    'Ferretería o construcción': { cat: 'tu lista de precios', verbo: 'Pide', cta: 'Cotiza por WhatsApp', fotos: 'tus productos', video: 'cómo usar una herramienta', valor: 'cómo usar los productos, consejos de obra y quién atiende', facil: 'la cotización por WhatsApp, el envío a obra o el pago con QR', saludo: 'tu pedido' },
    'Eventos': { cat: 'tus paquetes con precios', verbo: 'Reserva', cta: 'Reserva tu fecha por WhatsApp', fotos: 'tus eventos terminados', video: 'el montaje de un evento', valor: 'el antes y después de un montaje, quién trabaja y lo que dicen tus clientes', facil: 'la reserva de fecha por WhatsApp y el pago con QR', saludo: 'tu evento' },
    'Tienda o comercio': { cat: 'tu catálogo con precios', verbo: 'Pide', cta: 'Pide por WhatsApp', fotos: 'tus productos', video: 'las novedades de la semana', valor: 'cómo usar los productos, las novedades y quién atiende', facil: 'el catálogo de WhatsApp, el envío o el pago con QR', saludo: 'tu compra' },
    'Servicios': { cat: 'tus servicios con precios', verbo: 'Agenda', cta: 'Cotiza por WhatsApp', fotos: 'tus trabajos', video: 'cómo realizas tu servicio', valor: 'cómo trabajan, quién atiende y qué dicen tus clientes', facil: 'la cotización por WhatsApp y el pago con QR', saludo: 'tu servicio' }
  };
  var UNO = { 'Restaurante o comida': 'restaurante', 'Cafetería, heladería o panadería': 'cafetería', 'Bar o discoteca': 'bar', 'Hospedaje': 'alojamiento', 'Turismo': 'agencia de turismo',
    'Importadora o zona franca': 'importadora', 'Ropa y calzado': 'tienda de ropa y calzado', 'Tecnología': 'tienda de tecnología', 'Supermercado o abarrotes': 'supermercado', 'Farmacia o salud': 'negocio de salud',
    'Belleza': 'salón de belleza', 'Gimnasio o deporte': 'gimnasio', 'Educación': 'centro de formación', 'Taller o repuestos': 'taller', 'Ferretería o construcción': 'ferretería', 'Eventos': 'servicio de eventos', 'Tienda o comercio': 'tienda', 'Servicios': 'negocio de servicios' };
  var ESTRELLA = { 'Restaurante o comida': 'el plato de la semana', 'Cafetería, heladería o panadería': 'el producto del día', 'Bar o discoteca': 'el trago o el evento de la semana', 'Hospedaje': 'una habitación y su tarifa', 'Turismo': 'el tour de la semana',
    'Ropa y calzado': 'la prenda de la semana', 'Tecnología': 'el equipo de la semana', 'Supermercado o abarrotes': 'las ofertas de la semana', 'Farmacia o salud': 'un servicio y su horario', 'Belleza': 'un servicio y su precio',
    'Gimnasio o deporte': 'un plan y su precio', 'Educación': 'el próximo curso', 'Taller o repuestos': 'un servicio y su precio', 'Eventos': 'un paquete y su precio', 'Servicios': 'un servicio y su precio' };
  function voc(ev) { var v = VR[ev.rubro] || {}, o = {}; for (var k in V0) o[k] = v[k] || V0[k]; o.estrella = ESTRELLA[ev.rubro] || 'el producto de la semana'; return o; }

  /* ---------------------------------------------------------------- utilidades */
  function datos(ev) { return ev.datos || {}; }
  function preg(ev, id) { return datos(ev)['p_' + id] || {}; }
  function rev(ev) { return datos(ev).rev9 || 9; }
  function lista(a) { a = a.filter(Boolean); return a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1]; }
  function cita(t, n) { t = String(t || '').replace(/\s+/g, ' ').trim(); n = n || 70; return '«' + (t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t) + '»'; }
  function deN(n, total) { return n === 0 ? 'Ninguna de tus ' + total : n + ' de tus ' + total; }
  /* «Ninguna de tus 9 publicaciones dice» y «1 de tus 9 publicaciones dice»: con 0 o 1 el verbo va en singular */
  function vb(n, plural) { var S = { usan: 'usa', muestran: 'muestra', tienen: 'tiene', dicen: 'dice' }; return (n === 0 || n === 1) && S[plural] ? S[plural] : plural; }
  function tiempo(min) { if (min === 'sin') return 'sin respuesta en 24 horas'; if (min < 60) return min + ' minutos'; var h = Math.floor(min / 60), m = Math.round(min % 60);
    if (min >= 1440) return 'más de un día'; return h + (h === 1 ? ' hora' : ' horas') + (m ? ' y ' + m + ' minutos' : ''); }
  /* teléfono legible: 8 dígitos de Bolivia → +591 7xxxxxxx; con otro código de país se deja como está */
  function telefono(t) { var d = String(t || '').replace(/\D/g, ''); if (!d) return ''; if (d.length === 8) return '+591 ' + d; if (/^591\d{8}$/.test(d)) return '+591 ' + d.slice(3); return '+' + d; }
  function num(x, d) { return String(Math.round(x * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).replace('.', ','); }
  function usuario(nombre) { return '@' + norm(nombre).replace(/[^a-z0-9]/g, ''); }
  var SALUDO = /feliz (?:dia|navidad|ano|cumple)|felicidades|feliz \w+ a|\bgracias\b|bendecid|buen(?:os|as)? (?:dia|dias|tardes|noches)|\bcomunicado\b|\bcerrado\b/;

  /* ---------------------------------------------------------------- publicaciones */
  function posts(ev) {
    var t = ((datos(ev).entrada || {}).posts || []).filter(function (x) { return norm(x).length > 2; });
    if (!t.length) return null;
    var D = t.map(function (x) { var a = A.analizarPost(x); a.texto = x; a.saludo = SALUDO.test(norm(x)); return a; });
    var primero = function () { for (var i = 0; i < arguments.length; i++) { var x = D.filter(arguments[i])[0]; if (x) return x; } return null; };
    return { lista: D, sinCTA: primero(function (a) { return !a.accion && !a.saludo && !a.valor && (a.precio || a.promo); }, function (a) { return !a.accion && !a.saludo && !a.valor; }, function (a) { return !a.accion && !a.saludo; }),
      valor: primero(function (a) { return a.valor && !a.saludo; }, function (a) { return a.valor; }), interno: D.filter(function (a) { return a.precioInterno; })[0] || null,
      conPrecio: D.filter(function (a) { return a.precio; })[0] || null, promo: primero(function (a) { return a.promo && !a.medible && !/combo/.test(a.promo); }, function (a) { return a.promo && !a.medible; }),
      buena: D.filter(function (a) { return a.precio && a.accion; })[0] || null };
  }

  /* ---------------------------------------------------------------- teléfono, dirección y horario por canal */
  var CAMPOS = [['tel', 'teléfono'], ['dir', 'dirección'], ['hor', 'horario']];
  function canales(ev) {
    var nap = (datos(ev).entrada || {}).nap || {}, ks = Object.keys(nap).filter(function (k) { var r = nap[k] || {}; return (r.tel || r.dir || r.hor || '').trim(); });
    if (ks.length < 2) return null;
    var out = { nap: nap, canales: ks, grupos: {}, oficial: {}, faltan: {} };
    CAMPOS.forEach(function (c) {
      var con = ks.filter(function (k) { return (nap[k][c[0]] || '').trim(); }), G = [];
      con.forEach(function (k) { var v = nap[k][c[0]].trim(), g = G.filter(function (g) { return igual(c[0], g.v, v); })[0];
        if (g) g.canales.push(k); else G.push({ v: v, canales: [k] }); });
      /* el dato oficial: el de Google Maps o el más repetido */
      G.sort(function (a, b) { return (b.canales.indexOf('Google Maps') >= 0) - (a.canales.indexOf('Google Maps') >= 0) || b.canales.length - a.canales.length; });
      out.grupos[c[0]] = G; if (G[0]) out.oficial[c[0]] = G[0].v;
      out.faltan[c[0]] = con.length ? ks.filter(function (k) { return con.indexOf(k) < 0; }) : [];
    });
    return out;
  }
  function igual(campo, a, b) { var t = { a: {}, b: {} }; t.a[campo] = a; t.b[campo] = b; return !A.compararCanales(t).conflictos.length; }

  /* ---------------------------------------------------------------- ChatGPT: negocios que sí nombró */
  var NO_NOMBRE = { en: 1, te: 1, si: 1, para: 1, aqui: 1, estos: 1, estas: 1, algunos: 1, algunas: 1, puedes: 1, tambien: 1, ademas: 1, no: 1, sin: 1, por: 1, con: 1, es: 1, son: 1, hay: 1, otro: 1, otra: 1, otros: 1, recomiendo: 1,
    cobija: 1, pando: 1, bolivia: 1, brasil: 1, brasileia: 1, chatgpt: 1, google: 1, maps: 1, facebook: 1, instagram: 1, tiktok: 1, whatsapp: 1, av: 1, avenida: 1, calle: 1, plaza: 1, barrio: 1, zona: 1, centro: 1, mercado: 1,
    lunes: 1, martes: 1, miercoles: 1, jueves: 1, viernes: 1, sabado: 1, domingo: 1, el: 1, la: 1, los: 1, las: 1, un: 1, una: 1, mi: 1, tu: 1, sus: 1, su: 1, lo: 1, que: 1, como: 1, cuando: 1, donde: 1, ofrece: 1, ofrecen: 1, conocido: 1, conocida: 1, ideal: 1, opcion: 1, opciones: 1, nota: 1, importante: 1, recuerda: 1 };
  function nombrados(texto, propio) {
    var t = String(texto || '').replace(/\*\*|__|[#>*_`]/g, ' '), re = /[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ'’&.-]*(?:\s+(?:de|del|la|las|los|el|&)?\s*[A-ZÁÉÍÓÚÑ0-9][\wÁÉÍÓÚÑáéíóúñ'’&.-]*)*/g, m, out = [];
    while ((m = re.exec(t))) {
      var w = m[0].replace(/[.,:;]+$/, '').split(/\s+/), antes = t.slice(Math.max(0, m.index - 3), m.index);
      var k = function (x) { return NO_NOMBRE[norm(x).replace(/[^a-z0-9]/g, '')]; };
      if (w.some(function (x) { return /^(av|avenida|calle|barrio|plaza|zona)$/.test(norm(x).replace(/[^a-z]/g, '')); }) || /(?:\b(?:av|calle|barrio|zona)\.?\s*)$/i.test(t.slice(Math.max(0, m.index - 8), m.index))) continue;
      while (w.length && k(w[0])) { if (w.length > 1 && /^(el|la|los|las)$/i.test(w[0]) && !k(w[1])) break; w.shift(); }
      while (w.length && k(w[w.length - 1])) w.pop();
      if (!w.length) continue;
      var n = w.join(' '), inicio = m.index === 0 || /[.!?:\n]\s*$|^\s*$/.test(antes);
      if (w.length === 1 && (inicio || n.length < 4)) continue;
      if (propio && A.menciona(propio, n).si) continue;
      if (out.map(norm).indexOf(norm(n)) < 0) out.push(n);
    }
    return out.slice(0, 4);
  }

  /* ---------------------------------------------------------------- reseñas: cuántas de 5 estrellas faltan */
  function faltan5(prom, n, meta) { if (prom == null || !n || prom >= meta) return 0; return Math.ceil((meta * n - prom * n) / (5 - meta) - 1e-9); }

  /* ================================================================ evidencia: lo que se vio */
  function evidencia(ev, id) {
    var d = datos(ev), o = preg(ev, id), r = rev(ev), P = posts(ev), v = ev.resp[id], nombre = ev.nombre;
    switch (id) {
      case 'D1.1': if (o.tiene === false) return 'No usas un logotipo propio como foto de perfil.';
        if (o.tiene) { if (o.igual === false) return 'Tienes logotipo, pero no es el mismo en todas tus cuentas' + (o.legible === false ? ' y se ve cortado o borroso.' : '.');
          if (o.legible === false) return 'Tienes logotipo, pero se ve cortado o borroso en la foto de perfil.';
          if (o.igual && o.legible) return 'Tu logotipo es legible y es el mismo en todas tus cuentas.'; } return '';
      case 'D1.2': return o.n == null ? '' : deN(o.n, r) + ' publicaciones revisadas ' + vb(o.n, 'usan') + ' tus colores o tu plantilla.';
      case 'D1.3': if (o.distinto) return 'En alguna plataforma apareces con un nombre totalmente distinto.';
        if (o.mismo === false) return 'Tu nombre cambia de una plataforma a otra.';
        if (o.mismo && o.usuario === false) return 'Tu nombre es el mismo en todas, pero el usuario (@) cambia de una red a otra.';
        if (o.mismo && o.usuario) return 'Usas el mismo nombre y casi el mismo usuario en todas tus redes.'; return '';
      case 'D2.1': var f = d.ficha; if (!f) return ''; if (f.indexOf('Tiene ficha') < 0) return 'No encontramos tu negocio en Google Maps.';
        var fal = ['Categoría', 'Horario', 'Teléfono', 'Ubicación exacta', 'Fotos'].filter(function (x) { return f.indexOf(x) < 0; });
        var ART_F = { 'Categoría': 'la categoría', 'Horario': 'el horario', 'Teléfono': 'el teléfono', 'Ubicación exacta': 'la ubicación exacta', 'Fotos': 'las fotos' };
        return fal.length ? 'A tu ficha de Google Maps ' + (fal.length > 1 || fal[0] === 'Fotos' ? 'le faltan ' : 'le falta ') + lista(fal.map(function (x) { return ART_F[x] || x.toLowerCase(); })) + '.' : 'Tu ficha de Google Maps tiene todos los datos.';
      case 'D2.2': var C = canales(ev);
        if (C) { var fr = [];
          CAMPOS.forEach(function (c) { var G = C.grupos[c[0]]; if (G.length > 1) {
            if (c[0] === 'tel') fr.push('Tu teléfono es ' + G[0].v + ' en ' + lista(G[0].canales) + ', pero ' + G[1].v + ' en ' + lista(G[1].canales) + '.');
            else fr.push('Tu ' + c[1] + ' dice ' + cita(G[0].v, 40) + ' en ' + lista(G[0].canales) + ' y ' + cita(G[1].v, 40) + ' en ' + lista(G[1].canales) + '.'); } });
          if (fr.length < 2) CAMPOS.forEach(function (c) { if (fr.length < 2 && C.faltan[c[0]].length) fr.push('No figura tu ' + c[1] + ' en ' + lista(C.faltan[c[0]]) + '.'); });
          if (fr.length) return fr.slice(0, 2).join(' ');
          return 'Tu teléfono, tu dirección y tu horario coinciden en ' + lista(C.canales) + '.'; }
        if (o.contra) return 'Algún dato (teléfono, horario o dirección) no coincide entre tus canales.';
        if (o.falta) return 'Falta el teléfono, el horario o la dirección en alguno de tus canales.';
        if (o.contra === false && o.falta === false) return 'Tu teléfono, tu dirección y tu horario coinciden en todos tus canales.'; return '';
      case 'D2.3': var e = d.entrada || {}, pl = (ev.rubro === 'Otro' ? (ev.rubroDetalle || 'negocios') : (rubroPlural(ev.rubro) || 'negocios')).toLowerCase();
        if (o.recomienda) return 'ChatGPT ya nombra a ' + nombre + ' cuando alguien le pide recomendaciones de ' + pl + ' en Cobija.';
        if (o.recomienda === false) { var otros = nombrados(e.ia1, nombre), s = 'Cuando se le pide a ChatGPT recomendar ' + pl + ' en Cobija, ' + (otros.length ? 'nombra a ' + lista(otros) + ', pero no a ' + nombre + '.' : 'no menciona a ' + nombre + '.');
          if (o.reconoce === false) s += ' Y si se le pregunta directamente por tu negocio, dice no tener información.';
          else if (o.reconoce && o.correcto === false) s += ' Si se le pregunta por ti, te reconoce, pero con datos incompletos o con errores.';
          else if (o.reconoce && o.correcto) s += ' Si se le pregunta por ti, te reconoce con datos correctos.';
          return s; } return '';
      case 'D3.1': if (d.posts30 == null) return ''; return d.posts30 === 0 ? 'No publicaste nada en los últimos 30 días.' : 'Publicaste ' + (d.posts30 === 1 ? 'una vez' : d.posts30 + ' veces') + ' en los últimos 30 días' + (d.posts30 >= 8 ? ', dos o más por semana.' : '.');
      case 'D3.2': var fm = d.formatos; if (!fm) return ''; if (!fm.length) return 'No identificamos un formato constante en tus publicaciones.';
        return 'Usas ' + lista(fm.map(function (x) { return x.toLowerCase().replace('foto o afiche', 'fotos o afiches').replace('video corto', 'videos cortos').replace('carrusel', 'carruseles'); })) + '.';
      case 'D3.3': if (o.n == null) return ''; return deN(o.n, r) + ' publicaciones revisadas ' + vb(o.n, 'muestran') + ' algo más que promoción' + (P && P.valor ? ', como ' + cita(P.valor.texto, 60) : '') + '.';
      case 'D4.1': if (o.c == null) return ''; if (o.c === 0) return 'Tus publicaciones revisadas no tenían comentarios.'; return 'Respondiste ' + (o.r == null ? '?' : o.r) + ' de ' + o.c + ' comentarios en tus publicaciones.';
      case 'D4.2': if (o.n == null) return ''; return deN(o.n, r) + ' publicaciones ' + vb(o.n, 'tienen') + ' comentarios de clientes' + (o.comparte ? ' y compartes fotos u opiniones de ellos.' : o.comparte === false && v !== 2 ? ', y no compartes fotos u opiniones de tus clientes.' : '.');
      case 'D4.3': var m = d.respuesta_min; if (m == null) return ''; return m === 'sin' ? 'Te enviamos un mensaje de prueba y no hubo respuesta en 24 horas.' : 'Te enviamos un mensaje de prueba y respondiste en ' + tiempo(m) + '.';
      case 'D5.1': if (d.resenas == null) return ''; return d.resenas === 0 ? 'Todavía no tienes reseñas en Google.' : 'Tienes ' + d.resenas + (d.resenas === 1 ? ' reseña' : ' reseñas') + ' en Google' + (d.resenas < 20 ? '; te faltan ' + (20 - d.resenas) + ' para llegar a 20.' : '.');
      case 'D5.2': if (d.calificacion == null || !d.resenas) return ''; var k = faltan5(d.calificacion, d.resenas, 4.5);
        return 'Tu calificación en Google es ' + num(d.calificacion, 1) + ' de 5' + (k ? '; con ' + k + (k === 1 ? ' reseña nueva' : ' reseñas nuevas') + ' de 5 estrellas llegarías a 4,5.' : '.');
      case 'D5.3': if (o.r == null) return ''; var tot = Math.min(10, d.resenas || 10); return 'Respondiste ' + o.r + (tot === 1 ? ' de tu única reseña' : ' de tus últimas ' + tot + ' reseñas') + (o.neg ? (o.negr ? ', incluidas las negativas.' : ', y las negativas quedaron sin respuesta.') : '.');
      case 'D6.1': if (o.cat) return 'Tienes un menú, una lista o un catálogo con precios a la vista.';
        if (o.n == null) return ''; return deN(o.n, r) + ' publicaciones revisadas ' + vb(o.n, 'muestran') + ' el precio' + (P && P.interno && v !== 2 ? ', y en una dices ' + cita(P.interno.texto, 40) : '') + '.';
      case 'D6.2': if (o.n == null) return ''; return deN(o.n, r) + ' publicaciones revisadas ' + vb(o.n, 'dicen') + ' cómo comprar' + (P && P.sinCTA && v !== 2 ? '; por ejemplo, ' + cita(P.sinCTA.texto, 50) + ' no dice cómo pedirlo.' : '.');
      case 'D6.3': if (o.facil) return 'Ofreces formas fáciles de comprar: catálogo, botón, envío o pago con QR.'; if (o.pedir) return 'Muestras un teléfono o WhatsApp para pedir, pero no un catálogo, un envío o el pago con QR.'; if (o.pedir === false) return 'No muestras un teléfono ni un WhatsApp para hacer pedidos.'; return '';
      case 'D7.1': if (o.activos === false) return 'No encontramos anuncios activos tuyos en la Biblioteca de anuncios de Meta.'; if (o.activos && o.n != null) return o.n >= 2 ? 'Tienes ' + o.n + ' anuncios activos en Facebook o Instagram.' : 'Tienes un anuncio activo en Facebook o Instagram.'; return '';
      case 'D7.2': if (o.enlace === false) return 'No tienes un sitio web ni un enlace propio en tu perfil.'; if (o.propio === false) return 'Tu enlace lleva a un agrupador o a otra red, no a un sitio propio.'; if (o.funciona === false) return 'Tienes un sitio propio, pero no funciona o no muestra información y contacto.'; if (o.funciona) return 'Tienes un sitio web propio que funciona.'; return '';
      case 'D7.3': if (o.hay === false) return 'No publicaste promociones en los últimos 30 días.';
        if (o.hay && o.mide === false) return 'Publicaste promociones' + (P && P.promo ? ', como ' + cita(P.promo.texto, 50) : '') + ', pero ninguna permite saber cuántos clientes llegaron por las redes.';
        if (o.mide) return 'Tus promociones tienen una condición que permite medir cuántos clientes llegan por las redes.'; return '';
    }
    return '';
  }
  function rubroPlural(rubro) { return (window.MARKI_RUBROS && window.MARKI_RUBROS[rubro]) || ''; }

  /* ================================================================ acción: qué hacer, con sus datos */
  function accion(ev, id) {
    var d = datos(ev), o = preg(ev, id), r = rev(ev), v = ev.resp[id], P = posts(ev), W = voc(ev), C = canales(ev), wa = ev.links && ev.links.whatsapp;
    switch (id) {
      case 'D1.1': if (o.tiene === false || v === 0) return 'Diseña un logotipo simple que se lea bien en tamaño pequeño y úsalo como foto de perfil en todas tus cuentas.';
        if (o.igual === false) return 'Usa el mismo archivo de logotipo como foto de perfil en todas tus cuentas, para que te reconozcan en cualquier red.';
        return 'Sube tu logotipo en buena resolución y centrado, para que se lea completo en la foto de perfil.';
      case 'D1.2': return v === 0 ? 'Elige dos o tres colores y una tipografía, y arma en Canva una plantilla para tus publicaciones.' : 'Usa tu plantilla y tus colores en todas las publicaciones, no solo en algunas.';
      case 'D1.3': if (o.mismo === false || o.distinto) return 'Usa el mismo nombre, «' + ev.nombre + '», en todas las plataformas.';
        return 'Unifica tu usuario en todas las redes, por ejemplo ' + usuario(ev.nombre) + ' si está libre, para que te encuentren con una sola búsqueda.';
      case 'D2.1': var f = d.ficha || []; if (f.length && f.indexOf('Tiene ficha') < 0 || v === 0) return 'Crea gratis tu ficha en Google Business Profile con categoría, ubicación exacta, horario, teléfono y fotos.';
        var fal = ['Categoría', 'Horario', 'Teléfono', 'Ubicación exacta', 'Fotos'].filter(function (x) { return f.indexOf(x) < 0; }), tel = C && C.oficial.tel, hor = C && C.oficial.hor;
        if (!fal.length) return 'Completa tu ficha de Google con los datos que faltan y fotos actuales.';
        return 'Completa tu ficha de Google: ' + fal.map(function (x) { return x === 'Teléfono' ? 'agrega el teléfono' + (tel ? ' (' + tel + ')' : '') : x === 'Horario' ? 'agrega el horario' + (hor ? ' (' + hor + ')' : '') : x === 'Fotos' ? 'sube al menos 10 fotos actuales del local y de ' + W.fotos : x === 'Categoría' ? 'elige la categoría correcta' : 'marca la ubicación exacta en el mapa'; }).join('; ') + '.';
      case 'D2.2': if (C) { var q = [];
          if (C.grupos.tel.length > 1 || C.faltan.tel.length) q.push('el mismo teléfono' + (C.oficial.tel ? ' (' + C.oficial.tel + ')' : ''));
          if (C.grupos.hor.length > 1 || C.faltan.hor.length) q.push('el mismo horario' + (C.oficial.hor ? ' (' + C.oficial.hor + ')' : ''));
          if (C.grupos.dir.length > 1 || C.faltan.dir.length) q.push('la misma dirección' + (C.oficial.dir ? ' (' + C.oficial.dir + ')' : ''));
          if (q.length) return 'Deja ' + lista(q) + ' en ' + lista(C.canales) + '. Un dato distinto hace que el cliente llame a un número equivocado o llegue con el local cerrado.'; }
        return v === 0 ? 'Revisa tu teléfono, tu horario y tu dirección en cada plataforma y deja los mismos datos en todas.' : 'Completa los datos que faltan en algunos canales para que coincidan en todos.';
      case 'D2.3': return v === 0 ? 'Escribe en texto, no solo en imágenes, qué vendes, dónde estás y tu horario: en la descripción de tu ficha de Google, en tu perfil y en una publicación fijada. Es la información que leen Google y los asistentes de IA.'
        : 'Corrige los datos que la IA repite mal, empezando por tu ficha de Google, y pide a tus clientes reseñas que mencionen qué compraron.';
      case 'D3.1': return d.posts30 ? 'Pasa de ' + d.posts30 + ' a 8 publicaciones al mes: dos por semana, en días fijos (por ejemplo, martes y viernes).' : d.posts30 === 0 || v === 0 ? 'Retoma tus publicaciones con dos por semana, en días fijos (por ejemplo, martes y viernes).' : 'Publica con constancia: dos veces por semana, en días fijos (por ejemplo, martes y viernes).';
      case 'D3.2': var fm = d.formatos || [];
        if (fm.indexOf('Video corto') < 0) return 'Graba videos cortos verticales con tu celular; por ejemplo, ' + W.video + '.';
        return 'Suma un tercer formato: ' + (fm.indexOf('Carrusel') < 0 ? 'un carrusel con ' + W.cat : 'historias destacadas con ' + W.cat + ' y tu ubicación') + '.';
      case 'D3.3': return (v === 0 ? 'Alterna tus promociones con publicaciones que muestren ' : 'Que al menos 3 de cada 9 publicaciones muestren ') + W.valor + '.' + (P && P.valor ? ' Tu publicación ' + cita(P.valor.texto, 50) + ' es un buen modelo.' : '');
      case 'D4.1': return v === 0 ? 'Responde todos los comentarios, empezando por los que preguntan precio, horario o ubicación.' : 'Responde la mayoría de los comentarios, no solo las preguntas: también los saludos y las felicitaciones.';
      case 'D4.2': return v === 0 ? 'Termina tus publicaciones con una pregunta a tus clientes e invítalos a etiquetarte en sus fotos.' : 'Comparte en tu cuenta, con permiso, las fotos y opiniones que publican tus clientes.';
      case 'D4.3': return (d.respuesta_min === 'sin' || v === 0) ? 'Publica tu WhatsApp en todas tus cuentas y responde los mensajes el mismo día.' : 'Activa en WhatsApp Business un mensaje de bienvenida y respuestas rápidas para contestar en menos de una hora.';
      case 'D5.1': return d.resenas ? 'Pide una reseña en Google a cada cliente satisfecho, con un QR en el local o un mensaje por WhatsApp, hasta pasar de ' + d.resenas + ' a 20.' : 'Pide a tus primeros clientes satisfechos una reseña en Google, con un QR en el local o un mensaje por WhatsApp.';
      case 'D5.2': return 'Lee tus reseñas de 3 estrellas o menos, busca el problema que más se repite y corrígelo; luego responde contando qué cambiaste.';
      case 'D5.3': return o.neg && !o.negr ? 'Responde tus reseñas negativas con calma y una solución concreta: quien lee las reseñas mira, sobre todo, cómo respondes.' : 'Responde tus reseñas en Google: agradece las positivas y ofrece una solución en las negativas.';
      case 'D6.1': return (P && P.interno ? 'Cambia el «precio por interno» por el precio escrito: muchos clientes no preguntan. ' : '') + 'Publica ' + W.cat + ' y fija esa publicación al inicio de tu perfil' + (P && P.conPrecio ? '; tu publicación ' + cita(P.conPrecio.texto, 45) + ' ya muestra cómo hacerlo.' : '.');
      case 'D6.2': return 'Cierra cada publicación diciendo cómo comprar: «' + W.cta + (wa ? ' al ' + String(wa).replace(/^\+?591\s?/, '') : '') + '».' + (P && P.sinCTA ? ' Empieza por ' + cita(P.sinCTA.texto, 40) + '.' : '');
      case 'D6.3': return o.pedir === false || v === 0 ? 'Muestra tu WhatsApp en el perfil y en cada publicación para recibir pedidos y consultas por mensaje.' : 'Activa ' + W.facil + ' y anúncialo en tu perfil.';
      case 'D7.1': return o.activos ? 'Prueba un segundo anuncio con otra imagen o mensaje, para comparar cuál trae más consultas, dirigido a personas de Cobija.' : 'Prueba un anuncio pequeño en Facebook o Instagram, con presupuesto bajo, dirigido a personas de Cobija y con el botón «Enviar mensaje».';
      case 'D7.2': return o.enlace === false ? 'Crea una página simple con tu información, ' + W.cat + ' y un botón de WhatsApp, y enlázala desde todas tus cuentas.' : 'Mejora tu página con ' + W.cat + ', tu ubicación y un botón de WhatsApp.';
      case 'D7.3': return o.hay ? 'Agrega a tus promociones una palabra clave' + (P && P.promo ? ' (por ejemplo, ' + cita(P.promo.texto, 35) + ' + «di MARKI al pagar»)' : ', como «di MARKI al pagar»') + ', para contar cuántos clientes llegan por las redes.' : 'Lanza una promoción solo para tus seguidores, con una palabra clave al pagar, para medir cuántos clientes llegan por las redes.';
    }
    var it = itemDe(id); return it ? it.rec[v] || '' : '';
  }
  function itemDe(id) { var x = null; R.dimensiones.forEach(function (d) { d.items.forEach(function (it) { if (it.id === id) x = it; }); }); return x; }

  /* ================================================================ lectura general del caso */
  var CON_ART = { D1: 'la identidad de marca', D2: 'la presencia en búsquedas', D3: 'el contenido en redes', D4: 'la interacción con clientes', D5: 'la reputación en línea', D6: 'la conversión a venta', D7: 'la publicidad y la medición' };
  function lectura(ev, ctx) {
    var p = ctx.p, nv = ctx.nivel, recs = ctx.recs, D = R.dimensiones, nombre = ev.nombre;
    var conV = D.filter(function (d) { return p.dims[d.id] != null; }).slice().sort(function (a, b) { return p.dims[b.id] - p.dims[a.id]; });
    var fuerte = conV[0], debil = conV[conV.length - 1], s = [];
    if (fuerte && debil && p.dims[fuerte.id] !== p.dims[debil.id]) s.push('Tu punto más fuerte es ' + CON_ART[fuerte.id] + ' (' + Math.round(p.dims[fuerte.id]) + ') y el más débil, ' + CON_ART[debil.id] + ' (' + Math.round(p.dims[debil.id]) + ').');
    else if (fuerte && p.dims[fuerte.id] === 0) s.push('Ninguna de las dimensiones evaluadas suma puntos todavía.');
    else if (fuerte && p.dims[fuerte.id] === 100) s.push('Todas las dimensiones evaluadas están en el nivel más alto: 100 de 100.');
    else if (fuerte) s.push('Todas las dimensiones evaluadas están en un nivel parecido: ' + Math.round(p.dims[fuerte.id]) + ' de 100.');
    /* el patrón del caso */
    var x = function (id) { return p.dims[id] == null ? 50 : p.dims[id]; }, pl = (ev.rubro === 'Otro' ? (ev.rubroDetalle || 'negocios como el tuyo') : (rubroPlural(ev.rubro) || 'negocios como el tuyo')).toLowerCase();
    if (p.indice != null && p.indice < 25) s.push('Hoy, un cliente que te busca en internet encuentra muy poco: le cuesta encontrarte, saber qué vendes y cómo comprarte. La buena noticia es que los primeros pasos son simples y gratuitos.');
    else if (x('D2') <= 33 && (x('D3') >= 50 || x('D4') >= 50)) s.push('Quien ya te sigue en redes te conoce, pero quien busca ' + pl + ' en Cobija en Google o en ChatGPT casi no te encuentra: ahí se pierden clientes nuevos.');
    else if (x('D3') >= 67 && x('D6') <= 50) s.push('Publicas con constancia, pero tus publicaciones no terminan de vender: falta decir el precio y cómo comprar.');
    else if (x('D5') <= 33 && x('D2') >= 50) s.push('Te encuentran en Google, pero tus reseñas todavía no dan confianza a quien te ve por primera vez.');
    else if (x('D4') <= 33) s.push('Los clientes que escriben o comentan no reciben respuesta a tiempo, y eso se traduce en ventas que se van a otro lado.');
    else if (x('D6') <= 33) s.push('Aunque te encuentren, al cliente le cuesta comprarte: no ve precios ni una forma clara de pedir.');
    else if (x('D1') <= 33) s.push('Tu marca cambia de una red a otra, y eso hace que el cliente no la reconozca ni la recuerde.');
    else if (p.dims.D7 != null && p.dims.D7 <= 50) s.push('El siguiente paso es medir: saber qué publicación, anuncio o promoción trae más clientes.');
    else if (debil && p.dims[debil.id] < p.dims[fuerte.id]) s.push((nv.k >= 3 ? 'Para acercarte a 100, lo que más falta está en ' : 'Lo que más te separa del siguiente nivel está en ') + CON_ART[debil.id] + '.');
    /* un hallazgo que no se repite en «Por dónde empezar»: primero los que más llaman la atención */
    var top = recs.slice(0, 3), enTop = top.map(function (r) { return r.it.id; }), bajos = recs.map(function (r) { return r.it.id; }).filter(function (id) { return enTop.indexOf(id) < 0; });
    var orden = ['D2.3', 'D6.1', 'D2.2', 'D4.3', 'D5.2', 'D5.3', 'D6.2', 'D5.1', 'D3.1'].filter(function (id) { return bajos.indexOf(id) >= 0; }).concat(bajos);
    var h = orden.map(function (id) { return evidencia(ev, id); }).filter(Boolean)[0];
    if (h) s.push(h);
    if (top.length && top.every(function (r) { return r.it.esfuerzo === 'bajo'; })) s.push((top.length === 1 ? 'La acción prioritaria es' : 'Las ' + top.length + ' acciones prioritarias son') + ' de esfuerzo bajo: puedes empezar esta misma semana.');
    return s;
  }

  /* ================================================================ plan de 30 días: tres acciones por semana como máximo */
  function plan(recs) {
    var S = [['Semana 1', 'Lo más urgente'], ['Semana 2', 'Lo siguiente'], ['Semana 3', 'Lo siguiente'], ['Semana 4', 'Para completar el mes']], out = [];
    S.forEach(function (s, i) { var r = recs.slice(i * 3, i * 3 + 3); if (r.length) out.push({ t: s[0], s: s[1], recs: r }); });
    return { semanas: out, despues: recs.slice(12) };
  }

  /* ================================================================ kit: textos con los datos del negocio */
  function kit(ev, ctx) {
    var r = ev.resp, n = ev.nombre, W = voc(ev), C = canales(ev), P = posts(ev), d = datos(ev);
    var wa = telefono(ev.links && ev.links.whatsapp) || telefono(C && C.oficial.tel);
    var waT = wa || '[tu WhatsApp]', hor = (C && C.oficial.hor) || '[días y horario]', dir = (C && C.oficial.dir) || '[dirección]';
    var rub = ctx.rubroCorto || 'Tu negocio', resena = ev.google && ev.google.id ? 'https://search.google.com/local/writereview?placeid=' + ev.google.id : '[enlace para reseñas: en tu perfil de Google Business toca «Pedir reseñas» y cópialo]';
    var prio = {}; ctx.recs.forEach(function (x, i) { prio[x.it.id] = 100 - i; });
    var pr = function (ids) { return Math.max.apply(null, ids.map(function (id) { return prio[id] || 0; })); };
    var L = [];
    L.push({ t: 'Biografía para tus redes', p: 'Perfil de Facebook, Instagram y TikTok', ids: ['D2.2', 'D6.3', 'D1.3', 'D2.3'],
      x: n + ' · ' + rub + ' en Cobija 📍\n🕒 ' + hor + '\n📍 ' + dir + '\n📲 ' + W.cta + ': ' + waT });
    L.push({ t: 'Descripción para Google y la IA', p: 'Ficha de Google → Descripción. Úsala también en una publicación fijada', ids: ['D2.3', 'D2.1'],
      x: n + ' es ' + articulo(rubroTextoCorto(ev)) + ' en Cobija, Pando' + (C && C.oficial.dir ? ', ubicado en ' + C.oficial.dir : '') + '. ' + (C && C.oficial.hor ? 'Atiende de ' + C.oficial.hor + '. ' : '') + 'Ofrece [tus 3 productos o servicios principales]. ' + (wa ? 'Atención por WhatsApp al ' + wa + '.' : '') });
    if (P && P.sinCTA) L.push({ t: 'Tu publicación, mejorada', p: 'Antes: ' + cita(P.sinCTA.texto, 60) + '. Ahora le dice al cliente ' + (P.sinCTA.precio ? 'cómo pedir' : 'cuánto cuesta y cómo pedir'), ids: ['D6.2', 'D6.1'],
      x: P.sinCTA.texto.trim() + (P.sinCTA.precio ? '' : '\n💰 Bs [precio]') + '\n📲 ' + W.cta + ': ' + waT + '\n📍 ' + dir + ', Cobija' });
    else L.push({ t: 'Publicación con llamado a la acción', p: 'Termina siempre diciendo cómo comprar', ids: ['D6.2', 'D6.1', 'D3.3'],
      x: '[Foto o video de ' + W.fotos + ']\n✨ [Nombre del producto]: [qué lo hace especial]\n💰 Bs [precio]\n📲 ' + W.cta + ': ' + waT + '\n📍 ' + dir + ', Cobija' });
    if (P && P.interno) L.push({ t: 'En vez de «precio por interno»', p: 'Responde con el precio a la vista: el cliente que no ve precio casi nunca pregunta', ids: ['D6.1'],
      x: '[Producto]: Bs [precio] ✅\n' + W.verbo + ' por WhatsApp al ' + waT + ' y te confirmamos al instante.' });
    L.push({ t: 'Mensaje de bienvenida de WhatsApp Business', p: 'WhatsApp Business → Herramientas para la empresa → Mensaje de bienvenida', ids: ['D4.3', 'D6.3'],
      x: '¡Hola! 👋 Gracias por escribir a ' + n + '. En un momento te atendemos.\n🕒 Atendemos de ' + hor + '.' + (preg(ev, 'D6.3').facil ? '\nMientras tanto, mira el catálogo de este chat. ¿En qué te ayudamos?' : '\nCuéntanos qué necesitas y te respondemos enseguida.') });
    L.push({ t: 'Pedido de reseña a un cliente', p: 'Envíalo por WhatsApp después de cada ' + W.saludo.replace('tu ', ''), ids: ['D5.1', 'D5.2'],
      x: '¡Gracias por elegir ' + n + '! 🙌 ¿Nos ayudas con una reseña en Google? Toma menos de un minuto y ayuda a que más personas de Cobija nos encuentren:\n' + resena });
    L.push({ t: 'Respuesta a una reseña negativa', p: 'Responde con calma, sin discutir, y ofrece una solución', ids: ['D5.3', 'D5.2'],
      x: 'Hola, [nombre]. Lamentamos que tu experiencia no haya sido buena y gracias por contarnos. Ya estamos corrigiendo [el problema]. Escríbenos al ' + waT + ' para compensarte en tu próxima visita.' });
    L.push({ t: 'Promoción que se puede medir', p: 'Una palabra clave distinta en cada promoción te dice cuántos clientes llegan por las redes', ids: ['D7.3'],
      x: (P && P.promo ? P.promo.texto.trim() + '\n' : '🎉 [Tu promoción]\n') + '👉 Solo para seguidores: di «MARKI» al pagar.\nVálido hasta el [fecha].' });
    L.push({ t: 'Calendario simple de publicaciones', p: 'Dos publicaciones por semana, en días fijos', ids: ['D3.1', 'D3.2', 'D3.3'],
      x: 'Martes: ' + W.estrella + ', con precio y cómo pedirlo.\nViernes: un video corto (' + W.video + ').\nCada día: una historia (oferta, horario o un cliente contento).' });
    L.forEach(function (x, i) { x.pr = pr(x.ids) - i * .01; });
    return L.sort(function (a, b) { return b.pr - a.pr; }).slice(0, 6);
  }
  function rubroTextoCorto(ev) { return ev.rubro === 'Otro' ? (ev.rubroDetalle || 'negocio') : (UNO[ev.rubro] || 'negocio'); }
  function articulo(t) { t = String(t || 'negocio'); return (/^(tienda|ferretería|farmacia|cafetería|heladería|panadería|pastelería|importadora|academia|agencia|barbería|peluquería|discoteca|pollería|clínica|veterinaria)/i.test(t) ? 'una ' : 'un ') + t.toLowerCase(); }

  /* ================================================================ hallazgo para la pantalla de revelación */
  function hallazgo(ev, recs) { var ids = recs.map(function (r) { return r.it.id; }), orden = ['D2.3', 'D2.2', 'D6.1', 'D4.3', 'D5.2'].filter(function (id) { return ids.indexOf(id) >= 0; }).concat(ids);
    return orden.map(function (id) { return evidencia(ev, id); }).filter(Boolean)[0] || ''; }

  window.MARKI_REDACTOR = { evidencia: evidencia, accion: accion, lectura: lectura, plan: plan, kit: kit, hallazgo: hallazgo, nombrados: nombrados, canales: canales, faltan5: faltan5, voc: voc };
})();
