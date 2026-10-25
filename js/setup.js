/* ═══════════════════════════════════════════════
   SETUP — شاشة البداية + نافذة إعدادات القافلة
   ═══════════════════════════════════════════════ */
window.Setup = (function(){

  function showSetupScreen(){
    document.getElementById('setup-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    const s = State.get();
    document.getElementById('set-convoy').value = s.convoy || '';
    document.getElementById('set-team').value = s.team || '';
    document.getElementById('set-mgr1-name').value = s.mgr1?.name || '';
    document.getElementById('set-mgr1-phone').value = s.mgr1?.phone || '';
    document.getElementById('set-mgr2-name').value = s.mgr2?.name || '';
    document.getElementById('set-mgr2-phone').value = s.mgr2?.phone || '';
  }

  function hideSetupScreen(){
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
  }

  async function saveSetup(){
    const convoy = document.getElementById('set-convoy').value.trim();
    const team   = document.getElementById('set-team').value.trim();
    const m1n    = document.getElementById('set-mgr1-name').value.trim();
    const m1p    = document.getElementById('set-mgr1-phone').value.trim();
    const m2n    = document.getElementById('set-mgr2-name').value.trim();
    const m2p    = document.getElementById('set-mgr2-phone').value.trim();

    if(!convoy) return UI.toast('⚠️ اكتب اسم القافلة');
    if(!team)   return UI.toast('⚠️ اكتب اسم الفريق');

    State.saveSetup({
      convoy, team,
      mgr1: { name: m1n, phone: m1p },
      mgr2: { name: m2n, phone: m2p }
      // tools تؤخذ من الإعدادات اللاحقة
    });
    await State.save();

    hideSetupScreen();
    updateHeader();
    if(window.App) App.afterSetup();
  }

  // ═══ إعدادات القافلة ═══
  function openSettings(){
    const s = State.get();
    document.getElementById('modal-convoy').value = s.convoy || '';
    document.getElementById('modal-team').value = s.team || '';
    document.getElementById('modal-mgr1-name').value = s.mgr1?.name || '';
    document.getElementById('modal-mgr1-phone').value = s.mgr1?.phone || '';
    document.getElementById('modal-mgr2-name').value = s.mgr2?.name || '';
    document.getElementById('modal-mgr2-phone').value = s.mgr2?.phone || '';
    document.getElementById('modal-tools').value = s.tools || ''; // ← تحميل العدة
    UI.showModal('settings-modal');
  }

  function closeSettings(){
    UI.hideModal('settings-modal');
  }

  async function saveSettings(){
    const convoy = document.getElementById('modal-convoy').value.trim();
    const team   = document.getElementById('modal-team').value.trim();
    const m1n    = document.getElementById('modal-mgr1-name').value.trim();
    const m1p    = document.getElementById('modal-mgr1-phone').value.trim();
    const m2n    = document.getElementById('modal-mgr2-name').value.trim();
    const m2p    = document.getElementById('modal-mgr2-phone').value.trim();
    const tools  = document.getElementById('modal-tools').value.trim(); // ← قراءة العدة

    if(!convoy) return UI.toast('⚠️ اكتب اسم القافلة');
    if(!team)   return UI.toast('⚠️ اكتب اسم الفريق');

    State.saveSetup({
      convoy, team,
      mgr1: { name: m1n, phone: m1p },
      mgr2: { name: m2n, phone: m2p },
      tools: tools // ← حفظ العدة
    });
    await State.save();
    updateHeader();
    UI.toast('✅ تم حفظ الإعدادات');
    closeSettings();
  }

  function updateHeader(){
    const s = State.get();
    document.getElementById('header-convoy').textContent =
      `قافلة: ${s.convoy || '—'} — فريق: ${s.team || '—'}`;
  }

  return {
    showSetupScreen, hideSetupScreen, saveSetup,
    openSettings, closeSettings, saveSettings, updateHeader
  };
})();