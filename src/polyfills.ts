/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 *
 * This file is divided into 2 sections:
 *   1. Browser interactions (zone.js) is handled by Angular default.
 *   2. Application imports (PouchDB, Buffer)
 */

// import 'zone.js';  // Included with Angular CLI.

/***************************************************************************************************
 * APPLICATION IMPORTS
 */

// PouchDB ve eski Node modülleri için gerekli Polyfill'ler
(window as any).global = window;

// Buffer Polyfill - gracefully handle both Node and Browser environments
try {
  import('buffer').then(bufferModule => {
    (window as any).Buffer = bufferModule.Buffer;
  }).catch(() => {
    // Fallback if buffer module is not available
    // Browser/Electron may not need this polyfill
  });
} catch (e) {
  // Module import failed, continue without polyfill
}

try {
  import('process').then(processModule => {
    (window as any).process = processModule;
  }).catch(() => {
    // Fallback if process module is not available
  });
} catch (e) {
  // Module import failed, continue without polyfill
}

(window as any).global = window;

// jQuery and Bootstrap are loaded via angular.json scripts section.
// Do not import them here as it may cause timing issues with Bootstrap plugins.
// They will be available globally as $ and jQuery after scripts load.

