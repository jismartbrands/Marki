window.RUBRICA = {
 "version": "1.3",
 "niveles": [
  {
   "min": 0,
   "max": 24,
   "nombre": "Inicial",
   "texto": "La marca casi no aprovecha los canales digitales. Hay mucho por ganar con acciones simples."
  },
  {
   "min": 25,
   "max": 49,
   "nombre": "Básico",
   "texto": "La marca está presente, pero de forma irregular. Le falta constancia y orden."
  },
  {
   "min": 50,
   "max": 74,
   "nombre": "Intermedio",
   "texto": "La marca usa varios canales con cierta constancia. Le falta medir y convertir mejor."
  },
  {
   "min": 75,
   "max": 100,
   "nombre": "Avanzado",
   "texto": "La marca trabaja su presencia digital de forma ordenada. El reto es sostenerla y medir resultados."
  }
 ],
 "dimensiones": [
  {
   "id": "D1",
   "nombre": "Identidad de marca",
   "corto": "Identidad",
   "pregunta": "¿La marca se reconoce igual en todos sus canales?",
   "items": [
    {
     "id": "D1.1",
     "nombre": "Logotipo",
     "donde": "Foto de perfil de las cuentas que tenga: Facebook, Instagram, TikTok, WhatsApp y Google Maps",
     "n": [
      "No tiene logotipo: usa una foto cualquiera o solo texto",
      "Tiene logotipo, pero cambia entre cuentas o se ve borroso o cortado",
      "Tiene un logotipo legible y es el mismo en todas sus cuentas"
     ],
     "rec": [
      "Diseñar un logotipo simple y legible en tamaño pequeño, y usarlo como foto de perfil en todas las cuentas.",
      "Usar el mismo archivo de logotipo, en buena resolución y centrado, en todas las fotos de perfil."
     ],
     "esfuerzo": "medio",
     "impacto": "medio",
     "que": "Si el negocio tiene un logotipo propio y lo usa igual en todos sus perfiles, para que el cliente lo reconozca."
    },
    {
     "id": "D1.2",
     "nombre": "Coherencia visual",
     "donde": "Últimas 9 publicaciones de la red social principal",
     "n": [
      "Ninguna o solo una publicación usa los colores o la plantilla de la marca",
      "Dos o más publicaciones los usan, pero no la mayoría",
      "La mayoría de las publicaciones revisadas (más de la mitad) usa los mismos colores, tipografía o plantilla"
     ],
     "rec": [
      "Elegir dos o tres colores y una tipografía de la marca, y armar una plantilla base para las publicaciones.",
      "Aplicar la plantilla y los colores de la marca en todas las publicaciones, no solo en algunas."
     ],
     "esfuerzo": "medio",
     "impacto": "medio",
     "que": "Si las publicaciones tienen un estilo propio (colores, tipografía o plantilla) que permite reconocer a la marca sin leer su nombre."
    },
    {
     "id": "D1.3",
     "nombre": "Nombre de usuario consistente",
     "donde": "Nombre y usuario en cada red social y en Google Maps",
     "n": [
      "En alguna plataforma aparece con un nombre totalmente distinto",
      "El nombre es parecido en todas, pero cambia en alguna o el usuario (@) es distinto",
      "Usa el mismo nombre y un usuario (@) igual o casi igual en todas"
     ],
     "rec": [
      "Unificar el nombre del negocio en todas las plataformas y reservar el mismo usuario donde sea posible.",
      "Corregir las variaciones de nombre o usuario para que el cliente encuentre la marca con una sola búsqueda."
     ],
     "esfuerzo": "bajo",
     "impacto": "medio",
     "que": "Si el negocio aparece con el mismo nombre y un usuario (@) igual o parecido en todas las plataformas, para que el cliente lo encuentre."
    }
   ]
  },
  {
   "id": "D2",
   "nombre": "Presencia en búsquedas",
   "corto": "Búsquedas",
   "pregunta": "¿Un cliente que busca en Google o en una IA encuentra el negocio con datos correctos?",
   "items": [
    {
     "id": "D2.1",
     "nombre": "Ficha de Google Maps",
     "donde": "Búsqueda del nombre del negocio en Google Maps",
     "n": [
      "No tiene ficha en Google Maps",
      "Tiene ficha, pero le falta alguno de estos datos: categoría, horario, teléfono, ubicación exacta o fotos",
      "La ficha tiene los cinco datos: categoría, horario, teléfono, ubicación exacta y fotos"
     ],
     "rec": [
      "Crear y verificar la ficha del negocio en Google Business Profile, con categoría, ubicación, horario, teléfono y fotos.",
      "Completar la ficha de Google con los datos que faltan y agregar fotos actuales del local y los productos."
     ],
     "esfuerzo": "bajo",
     "impacto": "alto",
     "auto": {
      "tipo": "checks",
      "campo": "ficha",
      "etiqueta": "Marca lo que tiene la ficha",
      "opciones": [
       "Tiene ficha",
       "Categoría",
       "Horario",
       "Teléfono",
       "Ubicación exacta",
       "Fotos"
      ],
      "cortes": [
       1,
       6
      ]
     },
     "que": "Si el negocio aparece en Google Maps con los datos que el cliente necesita para llegar o contactarlo."
    },
    {
     "id": "D2.2",
     "nombre": "Datos iguales en todos los canales",
     "donde": "Teléfono, horario y dirección en Google Maps y en cada red social",
     "n": [
      "Algún dato (teléfono, horario o dirección) es distinto entre plataformas",
      "Ningún dato se contradice, pero falta alguno en algún canal",
      "El teléfono, el horario y la dirección están completos y son iguales en todos los canales"
     ],
     "rec": [
      "Revisar el teléfono, el horario y la dirección en cada plataforma y dejar los mismos datos en todas.",
      "Completar los datos que faltan en algunos canales para que coincidan en todos."
     ],
     "esfuerzo": "bajo",
     "impacto": "alto",
     "que": "Si el teléfono, el horario y la dirección son los mismos en Google Maps y en todas las redes, sin contradicciones."
    },
    {
     "id": "D2.3",
     "nombre": "Aparición en asistentes de IA",
     "donde": "Preguntar siempre a ChatGPT, versión gratuita, sin iniciar sesión y en una conversación nueva: «¿Qué me recomiendas de [rubro] en Cobija?» y «¿Qué sabes de [negocio] en Cobija, Bolivia?»",
     "n": [
      "El asistente no menciona ni reconoce el negocio",
      "Lo reconoce por su nombre, pero con datos incompletos o errores",
      "Lo recomienda por sí solo o lo describe con datos correctos"
     ],
     "rec": [
      "Tener una ficha de Google completa y publicar en las redes el nombre, la dirección, el rubro y el horario en texto, no solo en imágenes.",
      "Corregir los datos públicos que la IA repite con errores, empezando por la ficha de Google, y pedir reseñas que describan el negocio."
     ],
     "esfuerzo": "medio",
     "impacto": "medio",
     "que": "Si ChatGPT conoce al negocio: si lo recomienda cuando se le pide un negocio de su rubro en Cobija y si da datos correctos sobre él."
    }
   ]
  },
  {
   "id": "D3",
   "nombre": "Contenido en redes",
   "corto": "Contenido",
   "pregunta": "¿La marca publica con constancia y variedad?",
   "items": [
    {
     "id": "D3.1",
     "nombre": "Frecuencia de publicación",
     "donde": "Publicaciones de los últimos 30 días en la red social principal (sin contar las historias)",
     "n": [
      "Ninguna publicación en los últimos 30 días",
      "Entre 1 y 7 publicaciones (menos de dos por semana)",
      "8 publicaciones o más (dos por semana o más)"
     ],
     "rec": [
      "Retomar las publicaciones con un calendario simple de dos publicaciones por semana, en días fijos.",
      "Subir a dos publicaciones por semana como mínimo y mantenerlas en días fijos."
     ],
     "esfuerzo": "medio",
     "impacto": "alto",
     "auto": {
      "tipo": "numero",
      "campo": "posts30",
      "etiqueta": "Publicaciones en los últimos 30 días",
      "cortes": [
       1,
       8
      ],
      "paso": 1
     },
     "que": "Con qué frecuencia publica el negocio en su red social principal."
    },
    {
     "id": "D3.2",
     "nombre": "Variedad de formatos",
     "donde": "Publicaciones de los últimos 30 días y las historias destacadas del perfil",
     "n": [
      "Un solo formato (por ejemplo, solo afiches) o ninguna publicación",
      "Dos formatos",
      "Tres formatos o más (foto, video corto, carrusel, historias destacadas, en vivo)"
     ],
     "rec": [
      "Incorporar videos cortos verticales grabados con el celular, además de las fotos o afiches.",
      "Sumar un tercer formato, como carruseles o historias destacadas con el menú, los precios y la ubicación."
     ],
     "esfuerzo": "medio",
     "impacto": "medio",
     "auto": {
      "tipo": "checks",
      "campo": "formatos",
      "etiqueta": "Formatos usados en los últimos 30 días",
      "opciones": [
       "Foto o afiche",
       "Video corto",
       "Carrusel",
       "Historias destacadas",
       "Transmisión en vivo"
      ],
      "cortes": [
       2,
       3
      ]
     },
     "que": "Si el negocio usa varios formatos (fotos, videos cortos, carruseles, historias) y no siempre el mismo."
    },
    {
     "id": "D3.3",
     "nombre": "Contenido que aporta valor",
     "donde": "Últimas 9 publicaciones",
     "n": [
      "Todas las publicaciones revisadas son solo promoción o precio",
      "Al menos una muestra algo más: cómo trabajan, quién atiende, clientes o consejos",
      "Un tercio o más (3 o más de 9) muestra personas reales, procesos, testimonios o consejos útiles"
     ],
     "rec": [
      "Alternar las promociones con publicaciones que muestren cómo se prepara el producto, quién atiende o qué opinan los clientes.",
      "Llevar a un tercio las publicaciones de valor: detrás de escena, testimonios y consejos sobre el producto."
     ],
     "esfuerzo": "medio",
     "impacto": "medio",
     "que": "Si, además de promociones, el negocio publica contenido que genera confianza: cómo trabaja, quién atiende, sus clientes o consejos útiles."
    }
   ]
  },
  {
   "id": "D4",
   "nombre": "Interacción con clientes",
   "corto": "Interacción",
   "pregunta": "¿La marca conversa con sus clientes?",
   "items": [
    {
     "id": "D4.1",
     "nombre": "Respuesta a comentarios",
     "donde": "Comentarios de las últimas 9 publicaciones (si no hay comentarios, el indicador no se aplica)",
     "n": [
      "No respondió ningún comentario",
      "Respondió algunos comentarios, pero no la mayoría",
      "Respondió la mayoría de los comentarios"
     ],
     "rec": [
      "Responder todos los comentarios, sobre todo las preguntas de precio, horario y ubicación.",
      "Responder la mayoría de los comentarios, también los que no son preguntas, para animar la conversación."
     ],
     "esfuerzo": "bajo",
     "impacto": "alto",
     "que": "Si el negocio responde los comentarios que los clientes dejan en sus publicaciones."
    },
    {
     "id": "D4.2",
     "nombre": "Participación de los clientes",
     "donde": "Comentarios, etiquetas y contenido compartido por clientes",
     "n": [
      "Ninguna publicación revisada tiene comentarios de clientes",
      "Algunas publicaciones tienen comentarios de clientes",
      "La mayoría de las publicaciones tiene comentarios de clientes, o la marca comparte fotos y opiniones de sus clientes"
     ],
     "rec": [
      "Hacer preguntas en las publicaciones e invitar a los clientes a etiquetar a la marca en sus fotos.",
      "Compartir en la cuenta de la marca las fotos y opiniones que publican los clientes, con su permiso."
     ],
     "esfuerzo": "medio",
     "impacto": "medio",
     "que": "Si los clientes comentan las publicaciones, o si el negocio comparte las fotos y opiniones de sus clientes."
    },
    {
     "id": "D4.3",
     "nombre": "Respuesta a un mensaje",
     "donde": "Una consulta breve (por ejemplo, el horario o un precio) enviada por WhatsApp, Messenger o mensaje directo de la red principal, en horario de atención",
     "n": [
      "No hay canal de mensajes visible o no respondió en 24 horas",
      "Respondió entre 1 y 24 horas",
      "Respondió en menos de 1 hora"
     ],
     "rec": [
      "Publicar un número de WhatsApp en todas las cuentas y responder las consultas el mismo día.",
      "Activar respuestas rápidas o un mensaje de bienvenida en WhatsApp Business para responder en menos de una hora."
     ],
     "esfuerzo": "bajo",
     "impacto": "alto",
     "auto": {
      "tipo": "tiempo",
      "campo": "respuesta_min",
      "etiqueta": "Minutos hasta la respuesta",
      "sin": "Sin canal o sin respuesta en 24 h",
      "cortes": [
       60,
       1440
      ]
     },
     "que": "Cuánto tarda el negocio en responder un mensaje de consulta, por WhatsApp, Messenger o mensaje directo."
    }
   ]
  },
  {
   "id": "D5",
   "nombre": "Reputación en línea",
   "corto": "Reputación",
   "pregunta": "¿Qué dicen los clientes del negocio y cómo responde?",
   "items": [
    {
     "id": "D5.1",
     "nombre": "Cantidad de reseñas en Google",
     "donde": "Ficha de Google Maps",
     "n": [
      "Ninguna reseña o no tiene ficha",
      "Entre 1 y 19 reseñas",
      "20 reseñas o más"
     ],
     "rec": [
      "Pedir a los clientes satisfechos que dejen una reseña en Google, con un código QR en el local o un enlace por WhatsApp.",
      "Mantener el pedido de reseñas a los clientes para llegar a un número que dé confianza."
     ],
     "esfuerzo": "bajo",
     "impacto": "alto",
     "auto": {
      "tipo": "numero",
      "campo": "resenas",
      "etiqueta": "Número de reseñas en Google",
      "cortes": [
       1,
       20
      ],
      "paso": 1
     },
     "que": "Cuántas reseñas tiene el negocio en Google Maps. Más reseñas dan más confianza al cliente."
    },
    {
     "id": "D5.2",
     "nombre": "Calificación promedio",
     "donde": "Ficha de Google Maps (si no tiene reseñas, el indicador no se aplica)",
     "n": [
      "Calificación menor a 4,0",
      "Entre 4,0 y 4,4",
      "4,5 o más"
     ],
     "rec": [
      "Leer las reseñas negativas para encontrar el problema que más se repite y corregirlo en el servicio.",
      "Revisar qué se critica en las reseñas de 3 estrellas o menos y responder explicando qué se mejoró."
     ],
     "esfuerzo": "alto",
     "impacto": "alto",
     "auto": {
      "tipo": "numero",
      "campo": "calificacion",
      "etiqueta": "Calificación promedio (1 a 5)",
      "cortes": [
       4.0,
       4.5
      ],
      "paso": 0.1,
      "na_si_cero": "resenas"
     },
     "que": "La calificación promedio, en estrellas, del negocio en Google Maps."
    },
    {
     "id": "D5.3",
     "nombre": "Respuesta a reseñas",
     "donde": "Últimas 10 reseñas en Google Maps (si no tiene reseñas, el indicador no se aplica)",
     "n": [
      "No respondió ninguna reseña",
      "Respondió algunas reseñas, o no respondió las negativas",
      "Respondió la mayoría, incluidas las negativas"
     ],
     "rec": [
      "Responder las reseñas en Google con amabilidad, agradeciendo las positivas y ofreciendo solución en las negativas.",
      "Responder también las reseñas negativas, con calma y una solución concreta."
     ],
     "esfuerzo": "bajo",
     "impacto": "medio",
     "na_si_cero": "resenas",
     "que": "Si el negocio responde las reseñas de Google, sobre todo las negativas."
    }
   ]
  },
  {
   "id": "D6",
   "nombre": "Conversión a venta",
   "corto": "Venta",
   "pregunta": "¿El cliente sabe cuánto cuesta y cómo comprar?",
   "items": [
    {
     "id": "D6.1",
     "nombre": "Precios visibles",
     "donde": "Publicaciones, menú o catálogo",
     "n": [
      "No muestra precios (por ejemplo, «precio por interno»)",
      "Algunas publicaciones muestran el precio",
      "La mayoría de las publicaciones muestra el precio, o tiene un menú o catálogo con precios"
     ],
     "rec": [
      "Publicar los precios o un menú con precios; responder «precio por interno» hace que muchos clientes no pregunten.",
      "Publicar un menú o catálogo completo con precios y fijarlo en el perfil."
     ],
     "esfuerzo": "bajo",
     "impacto": "alto",
     "que": "Si el cliente puede ver los precios sin tener que preguntar."
    },
    {
     "id": "D6.2",
     "nombre": "Llamado a la acción",
     "donde": "Últimas 9 publicaciones",
     "n": [
      "Ninguna publicación revisada indica qué hacer para comprar",
      "Algunas indican cómo comprar",
      "La mayoría de las publicaciones revisadas dice cómo comprar: escribir, llamar, visitar o reservar"
     ],
     "rec": [
      "Cerrar cada publicación con una instrucción clara: «Escríbenos al…», «Visítanos en…» o «Reserva aquí».",
      "Agregar el llamado a la acción en todas las publicaciones, no solo en las promociones."
     ],
     "esfuerzo": "bajo",
     "impacto": "alto",
     "que": "Si las publicaciones le dicen al cliente qué hacer para comprar: escribir, llamar, visitar o reservar."
    },
    {
     "id": "D6.3",
     "nombre": "Facilidades para comprar",
     "donde": "Perfil, WhatsApp y publicaciones",
     "n": [
      "No muestra ningún teléfono ni WhatsApp para pedir: solo venta en el local",
      "Muestra un teléfono o WhatsApp para pedir, sin otras facilidades",
      "Tiene al menos una facilidad: catálogo de WhatsApp, botón de pedido o reserva, envío a domicilio o pago con QR anunciado"
     ],
     "rec": [
      "Habilitar pedidos por WhatsApp y anunciarlo en el perfil y en las publicaciones.",
      "Crear el catálogo de WhatsApp Business y anunciar el pago con QR o el envío a domicilio."
     ],
     "esfuerzo": "medio",
     "impacto": "alto",
     "que": "Si el negocio ofrece formas fáciles de comprar a distancia: pedido por mensaje, catálogo, envío a domicilio o pago con QR."
    }
   ]
  },
  {
   "id": "D7",
   "nombre": "Publicidad y medición",
   "corto": "Publicidad",
   "pregunta": "¿La marca invierte en anuncios y puede saber qué le funciona?",
   "items": [
    {
     "id": "D7.1",
     "nombre": "Anuncios en Meta",
     "donde": "Biblioteca de anuncios de Meta, buscando el nombre de la página (muestra solo los anuncios activos). Si el negocio no tiene Facebook ni Instagram, el indicador no se aplica",
     "n": [
      "No tiene anuncios activos",
      "Tiene un anuncio activo",
      "Tiene dos o más anuncios activos"
     ],
     "rec": [
      "Probar un anuncio pequeño en Facebook o Instagram, con un presupuesto bajo y dirigido a personas de Cobija.",
      "Retomar los anuncios con un objetivo claro (mensajes, visitas o seguidores) y comparar resultados."
     ],
     "esfuerzo": "medio",
     "impacto": "medio",
     "que": "Si el negocio invierte en anuncios pagados en Facebook o Instagram (Meta) en este momento."
    },
    {
     "id": "D7.2",
     "nombre": "Sitio web o enlace propio",
     "donde": "Perfil de redes y ficha de Google",
     "n": [
      "No tiene sitio web ni enlace propio",
      "Tiene una página básica o un agrupador de enlaces (como Linktree)",
      "Tiene un sitio web propio que funciona, con información y contacto"
     ],
     "rec": [
      "Crear una página simple con información, menú o catálogo y contacto, y enlazarla desde todas las cuentas.",
      "Mejorar la página con el menú o catálogo, la ubicación y un botón de WhatsApp."
     ],
     "esfuerzo": "alto",
     "impacto": "medio",
     "que": "Si el negocio tiene un sitio web o una página propia con su información y su contacto."
    },
    {
     "id": "D7.3",
     "nombre": "Promociones que se pueden medir",
     "donde": "Publicaciones de los últimos 30 días",
     "n": [
      "No hay promociones digitales",
      "Hay promociones, pero sin forma de saber de dónde vino el cliente",
      "Hay promociones con código, palabra clave o condición que permite medir su resultado"
     ],
     "rec": [
      "Lanzar una promoción solo para redes, por ejemplo «menciona esta publicación», para saber cuántos clientes llegan por ese medio.",
      "Agregar un código o palabra clave distinta a cada promoción para comparar cuál trae más clientes."
     ],
     "esfuerzo": "bajo",
     "impacto": "medio",
     "que": "Si las promociones permiten saber cuántos clientes llegaron por internet, por ejemplo con un código o una palabra clave."
    }
   ]
  }
 ]
};
