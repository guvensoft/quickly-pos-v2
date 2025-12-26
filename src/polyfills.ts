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

// Buffer Polyfill
import * as buffer from 'buffer';
const Buffer = buffer.Buffer;
import * as process from 'process';

(window as any).Buffer = Buffer;
(window as any).global = window;
(window as any).process = process;

// jQuery and Bootstrap are loaded via angular.json scripts section.
// Do not import them here as it may cause timing issues with Bootstrap plugins.
// They will be available globally as $ and jQuery after scripts load.

