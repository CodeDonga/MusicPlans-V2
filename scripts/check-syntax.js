// Verificación rápida de sintaxis JSX/ESM sin arrancar Metro.
// Uso: node scripts/check-syntax.js "ruta/al/archivo.jsx" [...más archivos]
const parser = require('@babel/parser');
const fs = require('fs');

const archivos = process.argv.slice(2);
let huboError = false;

for (const file of archivos) {
  try {
    parser.parse(fs.readFileSync(file, 'utf8'), {
      sourceType: 'module',
      plugins: ['jsx'],
    });
    console.log('OK   ' + file);
  } catch (e) {
    huboError = true;
    console.error('FAIL ' + file + ' -> ' + e.message);
  }
}

process.exit(huboError ? 1 : 0);
