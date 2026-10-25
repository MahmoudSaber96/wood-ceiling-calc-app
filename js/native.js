/* ═══════════════════════════════════════════════
   NATIVE — حفظ/مشاركة الملفات (أندرويد + متصفح)
   ═══════════════════════════════════════════════ */
window.Native = (function(){

  function isNative(){
    return !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
  }

  function blobToBase64(blob){
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1] || '');
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }

  function browserDownload(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // يحفظ الملف ويفتح قائمة المشاركة (حفظ في الملفات / Drive / واتساب ...)
  async function saveFile(blob, filename){
    if(isNative() && Capacitor.Plugins.Filesystem && Capacitor.Plugins.Share){
      const { Filesystem, Share } = Capacitor.Plugins;
      const data = await blobToBase64(blob);
      const res = await Filesystem.writeFile({ path: filename, data, directory: 'CACHE' });
      await Share.share({ title: filename, url: res.uri, dialogTitle: 'حفظ / مشاركة الملف' });
    } else {
      browserDownload(blob, filename);
    }
  }

  // طباعة PDF داخل أندرويد (window.print لا تعمل في WebView بدون جسر أصلي)
  if(window.AndroidPrint){
    window.print = function(){ window.AndroidPrint.print(); };
  }

  return { isNative, saveFile };
})();
