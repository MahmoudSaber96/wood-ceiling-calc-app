// يستبدل MainActivity بنسخة تدعم الطباعة/PDF
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const dir = path.join(root, 'android/app/src/main/java/com/woodceiling/app');
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(path.join(root, 'android-overrides/MainActivity.java'), path.join(dir, 'MainActivity.java'));
console.log('MainActivity patched');
