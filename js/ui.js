/* ═══════════════════════════════════════════════
   UI — Helpers (Toast / Tabs / Formatting)
   ═══════════════════════════════════════════════ */
window.UI = (function(){

  // ─── Toast ───
  let toastTimer;
  function toast(msg, ms){
    const el = document.getElementById('toast');
    if(!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms || 2400);
  }

  // ─── تنسيق الأرقام ───
  function fmt(n, d){
    if(n == null || n === '' || isNaN(n)) return '-';
    d = d == null ? 2 : d;
    return Number(n).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: d
    });
  }

  // ─── Escape HTML ───
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  // ─── التبويبات ───
  function initTabs(){
    document.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        const page = document.getElementById('page-' + t.dataset.tab);
        if(page) page.classList.add('active');
      });
    });
  }

  // ─── فتح/إغلاق Modal ───
  function showModal(id){
    const el = document.getElementById(id);
    if(el) el.style.display = 'flex';
  }
  function hideModal(id){
    const el = document.getElementById(id);
    if(el) el.style.display = 'none';
  }

  // ─── التاريخ ───
  function todayStr(){
    return new Date().toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
  function todayISO(){
    return new Date().toISOString().slice(0, 10);
  }

  return { toast, fmt, esc, initTabs, showModal, hideModal, todayStr, todayISO };
})();