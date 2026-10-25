/* ═══════════════════════════════════════════════
   DETAILS — كروت تفاصيل الأسقف
   ═══════════════════════════════════════════════ */
window.Details = (function(){

  function render(){
    const s = State.get();
    const cases = s.cases || [];
    const container = document.getElementById('details-content');
    if(!container) return;
    container.innerHTML = '';

    const empty = document.getElementById('details-empty');
    if(empty) empty.style.display = cases.length ? 'none' : 'block';

    if(!cases.length) return;

    const calcs = Calc.calcAll(cases, s.beamSpecs, s.plankSpec);

    // ── تجهيز قسم العدة ──
    let toolsHtml = '';
    const toolsRaw = (s.tools || '').trim();
    if(toolsRaw) {
      let toolLines = toolsRaw.split('\n').map(t => t.trim()).filter(t => t);
      if(toolLines.length > 0) {
        if (toolLines.length < 6) toolLines.push(''); // إضافة سطر فارغ للكتابة
        toolLines = toolLines.slice(0, 6); // حد أقصى 6 أسطر
        
        toolsHtml = `
          <div class="cbh-tools">
            <div class="cbh-tools-title">🧰 العدة</div>
            ${toolLines.map(line => `
              <div class="cbh-tool-line">
                <span class="tool-name">${UI.esc(line)}</span>
                <span class="tool-dots"></span>
              </div>
            `).join('')}
          </div>
        `;
      }
    }
  
    const bodyClass = toolsHtml ? 'cbh-body cbh-3cols' : 'cbh-body cbh-2cols';
  
    let blocks = '';
    calcs.forEach((r, i) => {
      blocks += `
        <div class="ceiling-block-h">
          <div class="cbh-header">
            <span>سقف رقم ${i+1} — ${UI.esc(r.name)} ${r.code ? `[${UI.esc(r.code)}]` : ''}</span>
            <span class="cbh-subtitle">قافلة: ${UI.esc(s.convoy || '—')} &nbsp;|&nbsp; فريق: ${UI.esc(s.team || '—')}</span>
          </div>
          
          <div class="${bodyClass}">
            <div class="cbh-data">
              <div class="cbh-field"><span>أبعاد الغرفة</span><b>${UI.fmt(r.D,0)} × ${UI.fmt(r.E,0)} سم</b></div>
              <div class="cbh-field"><span>مواصفة العرق</span><b>${r.beamH} × ${r.beamW} سم</b></div>
              <div class="cbh-field"><span>عدد العروق × الطول</span><b>${r.F} × ${r.G} سم</b></div>
              <div class="cbh-field"><span>عدد الألواح × الطول</span><b>${r.H} × ${r.I} سم</b></div>
              ${r.J ? `<div class="cbh-field"><span>الوصلات</span><b>${r.H} × ${r.J} سم</b></div>` : ''}
  
              <div class="cbh-managers">
                <div class="cbh-managers-title">📞 أرقام المسؤولين</div>
                <div class="cbh-manager-row">
                  <span>${UI.esc(s.mgr1?.name || '—')}</span>
                  <span class="cbh-ph">${UI.esc(s.mgr1?.phone || '—')}</span>
                </div>
                <div class="cbh-manager-row">
                  <span>${UI.esc(s.mgr2?.name || '—')}</span>
                  <span class="cbh-ph">${UI.esc(s.mgr2?.phone || '—')}</span>
                </div>
              </div>
            </div>
  
            ${toolsHtml}
  
            <div class="cbh-team">
              <div class="cbh-team-title">✍️ فريق التنفيذ</div>
              <div class="cbh-team-line">1.</div>
              <div class="cbh-team-line">2.</div>
              <div class="cbh-team-line">3.</div>
              <div class="cbh-team-line">4.</div>
              <div class="cbh-team-line">5.</div>
              <div class="cbh-team-line">6.</div>
              <div class="cbh-team-line">7.</div>
            </div>
          </div>
        </div>
      `;
    });

    // عرض الكروت داخل حاوية التطبيق لمعاينتها قبل الطباعة
    container.innerHTML = `
      <div class="print-doc preview-mode">
        ${blocks}
      </div>
    `;
  }

  function init(){ render(); }

  return { init, render };
})();