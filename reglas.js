/* Marki · reglas de decisión (versión 1)
   La rúbrica (rubrica.js) no cambia: los 21 indicadores y sus criterios de nivel 0, 1 y 2 son los mismos.
   Este archivo convierte cada criterio en preguntas sobre hechos observables (sí/no o un conteo).
   El evaluador responde lo que ve y Marki decide el nivel con la regla escrita debajo de cada indicador.
   «La mayoría» = más de la mitad de lo revisado. «Un tercio» = al menos un tercio de lo revisado. */
(function () {
  var R = window.RUBRICA; if (!R) return;
  R.reglasVersion = '1';
  /* rev = publicaciones revisadas de la red principal (las últimas 9; si tiene menos, las que tenga) */
  var P = function (texto, k, extra) { var q = { k: k, t: texto, tipo: 'sn' }; for (var x in extra || {}) q[x] = extra[x]; return q; };
  var N = function (texto, k, extra) { var q = { k: k, t: texto, tipo: 'num' }; for (var x in extra || {}) q[x] = extra[x]; return q; };
  var mayoria = function (n, total) { return n > total / 2; };
  var TEXTOS = {
   "D1.1.tiene": [
    "¿El negocio usa su propio logotipo como foto de perfil?",
    "Una foto del local, de un producto o solo letras no cuenta como logotipo."
   ],
   "D1.1.igual": [
    "¿Usa el mismo logotipo en todas sus cuentas?",
    "Compara la foto de perfil de Facebook, Instagram, TikTok y Google Maps."
   ],
   "D1.1.legible": [
    "¿El logotipo se ve bien: completo, nítido y fácil de leer?",
    "Si el círculo de la foto lo corta o se ve pixelado, marca No."
   ],
   "D1.2.n": [
    "¿En cuántas de las publicaciones que revisas se reconoce el estilo de la marca?",
    "Los mismos colores, el logotipo o una plantilla que se repite."
   ],
   "D1.3.distinto": [
    "¿En alguna red el negocio aparece con otro nombre?",
    "Por ejemplo, «Pollos Copacabana» en Facebook y «Pollería Don Juan» en TikTok."
   ],
   "D1.3.mismo": [
    "¿El nombre se escribe igual en todas sus cuentas?",
    "Si en alguna cambia o falta una palabra, marca No."
   ],
   "D1.3.usuario": [
    "¿El usuario (@) es igual o casi igual en todas?",
    "@polloscopacabana y @pollos.copacabana cuentan como casi iguales."
   ],
   "D2.2.contra": [
    "¿Algún dato no coincide entre sus cuentas?",
    "Otro teléfono en Instagram, otro horario en Google Maps o una dirección distinta."
   ],
   "D2.2.falta": [
    "¿Falta el teléfono, el horario o la dirección en alguna cuenta?",
    "Revisa Google Maps y cada red social que tenga."
   ],
   "D2.3.recomienda": [
    "Al pedirle recomendaciones, ¿ChatGPT nombra al negocio?",
    "Es la primera pregunta: «¿Qué me recomiendas de… en Cobija?»."
   ],
   "D2.3.reconoce": [
    "Al preguntarle por el negocio, ¿ChatGPT sabe cuál es?",
    "Segunda pregunta: «¿Qué sabes de… en Cobija?». Si dice que no tiene información, marca No."
   ],
   "D2.3.correcto": [
    "¿Lo que dice ChatGPT del negocio es correcto?",
    "Revisa el rubro, la ubicación y lo que vende."
   ],
   "D3.3.n": [
    "De las publicaciones que revisas, ¿cuántas muestran algo más que una oferta?",
    "Por ejemplo: cómo preparan, quién atiende, un cliente contento o un consejo útil."
   ],
   "D4.1.c": [
    "¿Cuántos comentarios de clientes hay en las publicaciones que revisas?",
    "Si son más de 20, anota 20. No cuentes las respuestas del propio negocio."
   ],
   "D4.1.r": [
    "¿A cuántos de esos comentarios respondió el negocio?",
    "Una respuesta escrita cuenta, aunque sea «¡Gracias!»; un «me gusta» no."
   ],
   "D4.2.n": [
    "De las publicaciones que revisas, ¿cuántas tienen al menos un comentario de un cliente?",
    "No cuentes los comentarios del propio negocio."
   ],
   "D4.2.comparte": [
    "¿El negocio comparte fotos u opiniones de sus clientes?",
    "Reseñas en historias, fotos de clientes o publicaciones donde lo etiquetan."
   ],
   "D5.3.r": [
    "¿Cuántas de las últimas 10 reseñas de Google tienen respuesta del negocio?",
    "Si tiene menos de 10 reseñas, revisa todas."
   ],
   "D5.3.neg": [
    "Entre esas reseñas, ¿hay alguna de 3 estrellas o menos?",
    ""
   ],
   "D5.3.negr": [
    "¿El negocio respondió esas reseñas negativas?",
    ""
   ],
   "D6.1.cat": [
    "¿Tiene un menú, una lista de precios o un catálogo a la vista?",
    "Una publicación fijada, el catálogo de WhatsApp o un enlace."
   ],
   "D6.1.n": [
    "De las publicaciones que revisas, ¿en cuántas aparece el precio?",
    "«Bs 25» cuenta; «precio por interno» no."
   ],
   "D6.2.n": [
    "De las publicaciones que revisas, ¿cuántas dicen cómo comprar?",
    "«Escríbenos al 7…», «pide por WhatsApp» o «visítanos en…»."
   ],
   "D6.3.pedir": [
    "¿Muestra un teléfono o WhatsApp para hacer pedidos?",
    "En el perfil, en la ficha de Google o en las publicaciones."
   ],
   "D6.3.facil": [
    "¿Ofrece alguna facilidad extra para comprar?",
    "Catálogo de WhatsApp, botón de pedido o reserva, envío a domicilio o pago con QR."
   ],
   "D7.1.meta": [
    "¿El negocio tiene Facebook o Instagram?",
    "Si solo usa TikTok o WhatsApp, marca No: este indicador no le resta puntos."
   ],
   "D7.1.activos": [
    "En la Biblioteca de anuncios de Meta, ¿tiene anuncios activos?",
    "Busca el nombre de su página en facebook.com/ads/library."
   ],
   "D7.1.n": [
    "¿Cuántos anuncios activos tiene?",
    "La biblioteca muestra el número de resultados."
   ],
   "D7.2.enlace": [
    "¿Tiene una página web o un agrupador de enlaces (como Linktree) en su perfil o en Google?",
    "Revisa la biografía de sus redes y su ficha de Google. Un enlace que solo abre WhatsApp u otra red social no cuenta."
   ],
   "D7.2.propio": [
    "¿Es una página web propia?",
    "Un Linktree no cuenta como página propia."
   ],
   "D7.2.funciona": [
    "¿La página abre y muestra información y contacto?",
    "Ábrela en el celular."
   ],
   "D7.3.hay": [
    "¿Publicó alguna promoción en los últimos 30 días?",
    "Descuentos, 2×1, combos o sorteos."
   ],
   "D7.3.mide": [
    "¿La promoción pide algo para saber que el cliente llegó por internet?",
    "Un código, decir una palabra al pagar o «mostrando esta publicación»."
   ]
  };
  var DEF = {
    'D1.1': { preguntas: [P('¿Usa un logotipo propio? (no una foto cualquiera ni solo texto)', 'tiene'),
        P('¿Es el mismo logotipo en todas sus cuentas?', 'igual', { si: 'tiene' }), P('¿Se ve legible, sin cortes y sin verse borroso?', 'legible', { si: 'tiene' })],
      regla: 'Sin logotipo: 0. Logotipo igual en todas las cuentas y legible: 2. En otro caso: 1.',
      f: function (o) { if (o.tiene === undefined) return; if (!o.tiene) return 0; if (o.igual === undefined || o.legible === undefined) return; return o.igual && o.legible ? 2 : 1; } },
    'D1.2': { preguntas: [N('De las publicaciones revisadas, ¿cuántas comparten los colores o la plantilla de la marca?', 'n', { maxRev: true })],
      regla: '0 o 1 publicación: 0. Dos o más: 1. La mayoría de las revisadas: 2.',
      f: function (o, d) { if (o.n == null) return; return mayoria(o.n, d.rev) ? 2 : o.n >= 2 ? 1 : 0; } },
    'D1.3': { preguntas: [P('¿En alguna plataforma aparece con un nombre totalmente distinto?', 'distinto'),
        P('¿El nombre del negocio es el mismo en todas las plataformas?', 'mismo', { no: 'distinto' }), P('¿El usuario (@) es igual o casi igual en todas?', 'usuario', { no: 'distinto' })],
      regla: 'Algún nombre totalmente distinto: 0. Mismo nombre y usuario igual o casi igual: 2. En otro caso: 1.',
      f: function (o) { if (o.distinto === undefined) return; if (o.distinto) return 0; if (o.mismo === undefined || o.usuario === undefined) return; return o.mismo && o.usuario ? 2 : 1; } },
    'D2.2': { preguntas: [P('¿Algún dato (teléfono, horario o dirección) se contradice entre plataformas?', 'contra'),
        P('¿Falta el teléfono, el horario o la dirección en algún canal?', 'falta', { no: 'contra' })],
      regla: 'Algún dato se contradice: 0. Ninguno se contradice, pero falta alguno: 1. Todo igual y completo: 2.',
      f: function (o) { if (o.contra === undefined) return; if (o.contra) return 0; if (o.falta === undefined) return; return o.falta ? 1 : 2; } },
    'D2.3': { preguntas: [P('Pregunta 1 (recomendación del rubro): ¿ChatGPT menciona al negocio?', 'recomienda'),
        P('Pregunta 2 (sobre el negocio): ¿ChatGPT lo reconoce?', 'reconoce', { no: 'recomienda' }),
        P('¿Los datos que da son correctos? (rubro, ubicación y qué ofrece)', 'correcto', { si: 'reconoce' })],
      regla: 'Lo menciona al recomendar, o lo reconoce con datos correctos: 2. Lo reconoce con datos incompletos o errores: 1. No lo reconoce: 0.',
      f: function (o) { if (o.recomienda === undefined) return; if (o.recomienda) return 2; if (o.reconoce === undefined) return; if (!o.reconoce) return 0; if (o.correcto === undefined) return; return o.correcto ? 2 : 1; } },
    'D3.3': { preguntas: [N('De las publicaciones revisadas, ¿cuántas muestran algo más que promoción o precio? (personas reales, procesos, testimonios o consejos)', 'n', { maxRev: true })],
      regla: 'Ninguna: 0. Al menos una: 1. Un tercio o más de las revisadas: 2.',
      f: function (o, d) { if (o.n == null) return; return o.n >= d.rev / 3 ? 2 : o.n >= 1 ? 1 : 0; } },
    'D4.1': { preguntas: [N('En las publicaciones revisadas, ¿cuántos comentarios de clientes hay? (cuenta hasta 20)', 'c', { max: 20 }),
        N('¿Cuántos de esos comentarios respondió la marca?', 'r', { maxDe: 'c', siMayor: 'c' })],
      regla: 'Sin comentarios: no se puede evaluar. No respondió ninguno: 0. Respondió la mayoría: 2. Respondió algunos: 1.',
      f: function (o) { if (o.c == null) return; if (o.c === 0) return null; if (o.r == null) return; return o.r === 0 ? 0 : mayoria(o.r, o.c) ? 2 : 1; } },
    'D4.2': { preguntas: [N('¿Cuántas de las publicaciones revisadas tienen al menos un comentario de un cliente?', 'n', { maxRev: true }),
        P('¿La marca comparte fotos u opiniones de sus clientes?', 'comparte')],
      regla: 'Comparte fotos u opiniones de clientes, o la mayoría de las publicaciones tiene comentarios: 2. Alguna tiene comentarios: 1. Ninguna: 0.',
      f: function (o, d) { if (o.n == null || o.comparte === undefined) return; return o.comparte || mayoria(o.n, d.rev) ? 2 : o.n >= 1 ? 1 : 0; } },
    'D5.3': { preguntas: [N('De las últimas 10 reseñas (o las que tenga), ¿cuántas tienen respuesta del negocio?', 'r', { maxResenas: true }),
        P('¿Hay reseñas negativas (3 estrellas o menos) entre ellas?', 'neg'), P('¿Respondió esas reseñas negativas?', 'negr', { si: 'neg' })],
      regla: 'Sin reseñas: no se puede evaluar. Ninguna respondida: 0. La mayoría respondida, incluidas las negativas: 2. En otro caso: 1.',
      f: function (o, d) { if (o.r == null || o.neg === undefined) return; if (o.neg && o.negr === undefined) return; var tot = Math.min(10, d.resenas || 10);
        return o.r === 0 ? 0 : mayoria(o.r, tot) && (!o.neg || o.negr) ? 2 : 1; } },
    'D6.1': { preguntas: [P('¿Tiene un menú, una lista o un catálogo con precios? (publicación fija, catálogo de WhatsApp o enlace)', 'cat'),
        N('De las publicaciones revisadas, ¿cuántas muestran el precio?', 'n', { maxRev: true, no: 'cat' })],
      regla: 'Menú o catálogo con precios, o precio en la mayoría de las publicaciones: 2. Algunos precios: 1. Ninguno («precio por interno»): 0.',
      f: function (o, d) { if (o.cat === undefined) return; if (o.cat) return 2; if (o.n == null) return; return mayoria(o.n, d.rev) ? 2 : o.n >= 1 ? 1 : 0; } },
    'D6.2': { preguntas: [N('¿Cuántas de las publicaciones revisadas dicen cómo comprar? (escribir, llamar, visitar o reservar)', 'n', { maxRev: true })],
      regla: 'Ninguna: 0. Algunas: 1. La mayoría de las revisadas: 2.',
      f: function (o, d) { if (o.n == null) return; return mayoria(o.n, d.rev) ? 2 : o.n >= 1 ? 1 : 0; } },
    'D6.3': { preguntas: [P('¿Muestra un teléfono o WhatsApp para hacer pedidos?', 'pedir'),
        P('¿Tiene catálogo de WhatsApp, botón de pedido o reserva, envío a domicilio o pago con QR anunciado?', 'facil')],
      regla: 'Catálogo, botón, envío o pago con QR: 2. Solo teléfono o WhatsApp para pedir: 1. Nada (solo venta presencial): 0.',
      f: function (o) { if (o.pedir === undefined || o.facil === undefined) return; return o.facil ? 2 : o.pedir ? 1 : 0; } },
    /* La Biblioteca de anuncios de Meta muestra los anuncios comerciales solo mientras están activos (fuera de la Unión Europea):
       por eso el criterio se basa en cuántos anuncios activos tiene, que sí se puede observar. */
    'D7.1': { preguntas: [P('¿El negocio tiene página de Facebook o cuenta de Instagram?', 'meta'), P('En la Biblioteca de anuncios de Meta, ¿tiene anuncios activos?', 'activos', { si: 'meta' }), N('¿Cuántos anuncios activos tiene?', 'n', { si: 'activos', max: 99 })],
      regla: 'Sin Facebook ni Instagram: no se evalúa (no resta puntos). Sin anuncios activos: 0. Un anuncio activo: 1. Dos o más: 2.',
      f: function (o) { if (o.meta === undefined) return; if (o.meta === false) return null; if (o.activos === undefined) return; if (!o.activos) return 0; if (o.n == null) return; return o.n >= 2 ? 2 : o.n >= 1 ? 1 : 0; } },
    'D7.2': { preguntas: [P('¿Tiene un sitio web o un enlace propio en su perfil o en Google?', 'enlace'),
        P('¿Es un sitio web propio? (no un agrupador de enlaces ni otra red social)', 'propio', { si: 'enlace' }), P('¿Funciona y muestra información y contacto?', 'funciona', { si: 'propio' })],
      regla: 'Sin enlace propio: 0. Sitio propio que funciona, con información y contacto: 2. En otro caso (página básica o agrupador): 1.',
      f: function (o) { if (o.enlace === undefined) return; if (!o.enlace) return 0; if (o.propio === undefined) return; if (!o.propio) return 1; if (o.funciona === undefined) return; return o.funciona ? 2 : 1; } },
    'D7.3': { preguntas: [P('En los últimos 30 días, ¿publicó alguna promoción?', 'hay'), P('¿Alguna tiene código, palabra clave o condición para saber de dónde vino el cliente?', 'mide', { si: 'hay' })],
      regla: 'Sin promociones: 0. Promociones con código, palabra clave o condición: 2. Promociones sin forma de medir: 1.',
      f: function (o) { if (o.hay === undefined) return; if (!o.hay) return 0; if (o.mide === undefined) return; return o.mide ? 2 : 1; } }
  };
  R.REGLAS = DEF;
  /* Reglas de los 6 indicadores que ya se calculaban con un dato registrado (sin cambios) */
  var YA = { 'D2.1': 'Sin la casilla «Tiene ficha»: 0. Ficha con alguno de los 5 datos faltante: 1. Ficha con los 5 datos: 2.',
    'D3.1': 'Ninguna publicación en 30 días: 0. De 1 a 7: 1. 8 o más: 2.',
    'D3.2': 'Un formato: 0. Dos formatos: 1. Tres o más: 2.',
    'D4.3': 'Sin canal de mensajes o sin respuesta en 24 horas: 0. Entre 1 y 24 horas: 1. Menos de 1 hora: 2.',
    'D5.1': 'Ninguna reseña: 0. De 1 a 19: 1. 20 o más: 2.',
    'D5.2': 'Sin reseñas: no se puede evaluar. Menor a 4,0: 0. De 4,0 a 4,4: 1. 4,5 o más: 2.' };
  R.dimensiones.forEach(function (d) { d.items.forEach(function (it) {
    if (it.auto && YA[it.id] && !it.auto.regla) it.auto.regla = YA[it.id];
    var x = DEF[it.id]; if (!x || it.auto) return;
    it.auto = { tipo: 'preguntas', campo: 'p_' + it.id, etiqueta: 'Responde lo que ves', preguntas: x.preguntas, regla: x.regla };
    if (it.na_si_cero) { it.auto.na_si_cero = it.na_si_cero; }
    /* Preguntas redactadas en lenguaje simple, con un ejemplo para el evaluador (no cambian las reglas) */
    it.auto.preguntas.forEach(function (q) { var x = TEXTOS[it.id + '.' + q.k]; if (x) { q.t = x[0]; q.ej = x[1]; } });
  }); });
})();
