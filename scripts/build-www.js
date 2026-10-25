// ينسخ ملفات الويب إلى www ويضيف مكتبة Excel محلياً (للعمل بدون إنترنت)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'lib'), { recursive: true });
fs.copyFileSync(path.join(root, 'index.html'), path.join(out, 'index.html'));
fs.cpSync(path.join(root, 'css'), path.join(out, 'css'), { recursive: true });
fs.cpSync(path.join(root, 'js'),  path.join(out, 'js'),  { recursive: true });
const x = path.join(root, 'node_modules/xlsx/dist/xlsx.full.min.js');
if (!fs.existsSync(x)) { console.error('شغّل npm install أولاً'); process.exit(1); }
fs.copyFileSync(x, path.join(out, 'lib/xlsx.full.min.js'));
// capacitor.js يُحقن تلقائياً عند cap sync
console.log('www ready');
