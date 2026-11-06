'use strict';
const fs = require('fs');
const path = require('path');
const dest = path.join(__dirname, 'app', 'vendor');
fs.mkdirSync(dest, { recursive: true });
for (const [from, to] of [
  ['mammoth/mammoth.browser.min.js', 'mammoth.browser.min.js'],
  ['jszip/dist/jszip.min.js', 'jszip.min.js'],
  ['pdfjs-dist/build/pdf.min.js', 'pdf.min.js'],
  ['pdfjs-dist/build/pdf.worker.min.js', 'pdf.worker.min.js'],
  ['docx-templates/lib/browser.js', 'docx-templates.browser.js']
]) fs.copyFileSync(require.resolve(from), path.join(dest, to));
console.log('Библиотеки подготовлены для автономной работы.');
