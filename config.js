/*
 * MARKI · Configuración para la versión en línea
 * ------------------------------------------------
 * Si pegas aquí la dirección de tu aplicación web de Apps Script y su clave, TODOS los equipos que abran
 * Marki desde el enlace en línea guardarán una copia de cada evaluación en tu hoja de Google, sin configurar nada.
 *
 * Cómo llenarlo:
 *   hojaUrl   → la dirección que termina en /exec (Apps Script → Implementar → Aplicación web).
 *   hojaClave → la misma clave que escribiste en el código de Apps Script (const CLAVE = '...').
 *
 * Déjalo vacío ('') si cada equipo se configura a mano en Marki → Configuración.
 *
 * La CLAVE DE LECTURA (la que permite traer al televisor del stand lo evaluado en los celulares) NO va aquí:
 * escríbela solo en el equipo del stand y en el del docente, en Marki → Configuración.
 * En un equipo, lo que se guarde en Configuración tiene prioridad sobre este archivo.
 *
 * Importante: este archivo queda visible en internet. Con la clave, alguien que la copie podría agregar filas
 * o reemplazar filas existentes en la hoja, pero no puede leer los datos: la hoja sigue siendo privada y solo
 * la abre quien tenga permiso en Google Drive. Si pasara algo, Google Sheets guarda el historial de versiones
 * (Archivo → Historial de versiones) y Marki permite descargar respaldos. Después de la Feria puedes cambiar la clave.
 */
window.MARKI_CONFIG = {
  hojaUrl: 'https://script.google.com/macros/s/AKfycbx8gUW9aLyrxjTOHIu_o0zdTiZi_Wt9TFBbWprtECcDv259HUKC2vXwow8JD3m5RK7_/exec',
  hojaClave: 'GgxDySFKlNTI'     // ← igual a CLAVE en el código de Apps Script
};
