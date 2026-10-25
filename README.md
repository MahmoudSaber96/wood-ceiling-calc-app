# حساب أسقف الخشب — تطبيق أندرويد

## بناء الـ APK (الأسهل: GitHub Actions)
1. ارفع محتوى هذا المجلد كاملاً إلى مستودع GitHub جديد.
2. من تبويب **Actions** شغّل **Build APK** (أو يعمل تلقائياً عند الرفع).
3. بعد انتهائه نزّل `wood-ceiling-apk` من قسم Artifacts، وفيه `app-debug.apk`.

## البناء على جهازك
المتطلبات: Node 20+ و JDK 17 و Android SDK.
```
npm install
npm run android:apk
```
الناتج: `android/app/build/outputs/apk/debug/app-debug.apk`

## قاعدة البيانات
- تُخزَّن داخل الجهاز (IndexedDB) وتعمل بدون إنترنت.
- **تصدير/استيراد كامل:** من ⚙️ الإعدادات أو من تبويب «الحالات» (ملف JSON).
- **Excel/CSV:** التصدير يفتح قائمة المشاركة (حفظ في الملفات/Drive/واتساب)، والاستيراد من «رفع Excel».
- **PDF:** زر الطباعة يفتح طباعة أندرويد (حفظ كـ PDF).
