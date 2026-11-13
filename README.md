# Marki · Diagnóstico de presencia digital

Herramienta web de la **Universidad Amazónica de Pando (UAP)**, Carrera de Ingeniería Comercial, asignatura Marketing Digital (ICOM261).
Evalúa la presencia digital de un negocio de Cobija con 21 indicadores en 7 dimensiones y entrega al dueño un diagnóstico con acciones concretas, en PDF y en imagen para redes.

Docente responsable: Ing. Jimmy Luis Laruta Villarreal · Feria FEXCOIN UAP 2026.

## Cómo se usa

Abre la página publicada (GitHub Pages) en el celular o en la computadora. No hay que instalar nada.

## Dónde se guardan los datos

| Lugar | Qué guarda | Para qué |
|---|---|---|
| **Hoja de Google del docente** (Google Drive) | Cada evaluación completa: las 21 respuestas, puntajes, datos, foto del lugar y opinión del dueño. Los expertos, en su propia pestaña. | Es el **registro oficial**. Se consulta desde cualquier lugar y se descarga como Excel. |
| Navegador de cada equipo | Una copia de lo evaluado en ese equipo. | Permite trabajar sin internet: lo pendiente sube solo a la hoja cuando vuelve la conexión. |
| Este repositorio (GitHub) | Solo el programa. **Ningún dato** de los negocios. | Publicar la página. |

- La hoja es privada: solo la abre su dueño en Google Drive. Desde Marki solo se puede **leer** con la clave de lectura, que no está en este repositorio.
- `config.js` lleva la dirección de la hoja y la clave para **enviar** datos, así todos los equipos guardan en la hoja sin configurar nada.
- No se guardan el teléfono ni el correo del dueño.

## Configuración

1. Crea una hoja de Google, abre **Extensiones → Apps Script**, pega el código de `Codigo_Apps_Script.gs` con tus claves e implementa como **aplicación web** (Ejecutar como: Yo · Acceso: Cualquier persona).
2. Pega la dirección que termina en `/exec` en `config.js` (`hojaUrl`) y guarda el cambio en GitHub.
3. En el equipo del stand y en el del docente, escribe la clave de lectura en Marki → Configuración.

Más detalle en `LEEME.md`.

## Licencias

Código de Marki: uso académico de la UAP. jsPDF (MIT) y las fuentes Atkinson Hyperlegible Next y Bricolage Grotesque (SIL OFL) conservan sus licencias en los archivos LICENCIA_*.
