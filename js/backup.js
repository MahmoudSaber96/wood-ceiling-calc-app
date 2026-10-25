/* ═══════════════════════════════════════════════
   BACKUP — تصدير/استيراد قاعدة البيانات كاملة (JSON)
   ═══════════════════════════════════════════════ */
window.Backup = (function(){

  const MARK = 'WOOD_CEILING_DB';
  const VERSION = 1;

  async function exportDB(){
    try{
      const s = State.get();
      const payload = {
        mark: MARK,
        version: VERSION,
        exportedAt: new Date().toISOString(),
        state: s
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const safe = (s.convoy || 'قافلة').replace(/[\\/:*?"<>|]/g, '_');
      const name = `نسخة_احتياطية_${safe}_${UI.todayISO()}.json`;
      await Native.saveFile(blob, name);
      UI.toast('✅ تم تصدير قاعدة البيانات');
    }catch(e){
      console.error(e);
      UI.toast('⚠️ فشل التصدير — ' + (e.message || e));
    }
  }

  function pickFile(){
    document.getElementById('backup-file-inp').click();
  }

  async function importDB(ev){
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if(!file) return;
    try{
      const text = await file.text();
      const data = JSON.parse(text);
      if(!data || data.mark !== MARK || !data.state || typeof data.state !== 'object'){
        throw new Error('الملف ليس نسخة احتياطية من هذا البرنامج');
      }
      const st = data.state;
      if(!Array.isArray(st.cases) || !Array.isArray(st.beamSpecs)){
        throw new Error('بيانات النسخة الاحتياطية ناقصة أو تالفة');
      }
      const n = st.cases.length;
      const when = data.exportedAt ? new Date(data.exportedAt).toLocaleString('ar-EG') : '—';
      if(!confirm(`سيتم استبدال كل البيانات الحالية بالنسخة الاحتياطية:\n• ${n} حالة\n• تاريخ النسخة: ${when}\n\nهل تريد المتابعة؟`)) return;

      State.set(st);
      st.setupDone = true;
      await State.save();
      await State.load();          // يعيد ضبط العدادات
      Setup.hideSetupScreen();
      Setup.updateHeader();
      App.afterSetup();
      UI.hideModal('settings-modal');
      UI.toast('✅ تم استيراد قاعدة البيانات');
    }catch(e){
      console.error(e);
      UI.toast('⚠️ فشل الاستيراد — ' + (e.message || e), 4000);
    }
  }

  return { exportDB, pickFile, importDB };
})();
