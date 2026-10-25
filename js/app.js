/* ═══════════════════════════════════════════════
   APP — Bootstrap
   ═══════════════════════════════════════════════ */
window.App = (function(){

  async function init(){
    try{
      await State.load();
      UI.initTabs();

      const s = State.get();
      if(s.setupDone && s.convoy && s.team){
        Setup.hideSetupScreen();
        Setup.updateHeader();
        afterSetup();
      } else {
        Setup.showSetupScreen();
      }
    } catch(err){
      console.error('App init error:', err);
      UI.toast('⚠️ خطأ في التهيئة: ' + err.message);
      Setup.showSetupScreen();
    }
  }

  function afterSetup(){
    console.log('✅ Setup complete, initializing modules...');

    // 1. تهيئة الشاشات الثابتة (الإعدادات والحالات)
    if(window.Specs) Specs.init();
    if(window.Cases) Cases.init();

    // 2. تهيئة شاشات العرض بالبيانات المحفوظة
    refreshAll();
  }

  // ★ دالة شاملة تُعيد رسم كل شيء (بما فيها جدول الحالات والمواصفات)
  function refreshAll(){
    try{
      if(window.Cases)        Cases.render();
      if(window.Specs)        Specs.renderBeamSpecs(), Specs.renderPlankSpec();
      if(window.CalcView)     CalcView.render();
      if(window.Details)      Details.render();
      if(window.Distribution) Distribution.render();
      if(window.Order)        Order.render();
      refreshCounters();
    } catch(err){
      console.error('refreshAll error:', err);
      UI.toast('⚠️ خطأ في التحديث: ' + err.message);
    }
  }

  function refreshCounters(){
    const s = State.get();
    const cnt = document.getElementById('case-count');
    if(cnt) cnt.textContent = (s.cases||[]).length;
    const bcnt = document.getElementById('beam-spec-count');
    if(bcnt) bcnt.textContent = (s.beamSpecs||[]).length;
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init, afterSetup, refreshCounters, refreshAll };
})();