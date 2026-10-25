/* ═══════════════════════════════════════════════
   ORDER — عرض الطلبية الإجمالية
   ═══════════════════════════════════════════════ */
window.Order = (function(){

  function render(){
    const s = State.get();
    const cases = s.cases || [];
    const container = document.getElementById('order-content');
    if(!container) return;
    container.innerHTML = '';

    const empty = document.getElementById('order-empty');
    if(empty) empty.style.display = cases.length ? 'none' : 'block';
    if(!cases.length) return;

    const calcs = Calc.calcAll(cases, s.beamSpecs, s.plankSpec);
    const order = Calc.buildOrder(calcs, s.plankSpec);

    // ── طلبية العروق ──
    let beamRows = '';
    Object.values(order.beams).forEach(b => {
      Object.keys(b.lengths).map(Number).sort((a,b)=>a-b).forEach(len => {
        const qty = b.lengths[len];
        const vol = qty * len * (b.height*b.width/100) / 1e6;
        const cost = vol * b.price;
        beamRows += `
          <tr>
            <td>${b.height}×${b.width}</td>
            <td>${len}</td>
            <td>${qty}</td>
            <td>${UI.fmt(vol,4)}</td>
            <td>${UI.fmt(cost,0)}</td>
          </tr>
        `;
      });
    });

    // ── طلبية الألواح ──
    let plankRows = '';
    Object.values(order.planks).sort((a,b)=>a.length-b.length).forEach(p => {
      plankRows += `
        <tr>
          <td>${p.length}</td>
          <td>${p.qty}</td>
          <td>${UI.fmt(p.vol,4)}</td>
          <td>${UI.fmt(p.cost,0)}</td>
        </tr>
      `;
    });

    container.innerHTML = `
      <div class="card">
        <h3>🪵 طلبية العروق</h3>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>المواصفة</th><th>الطول (سم)</th><th>العدد</th>
              <th>التكعيب (م³)</th><th>التكلفة (ج)</th>
            </tr></thead>
            <tbody>${beamRows || '<tr><td colspan="5">لا يوجد</td></tr>'}</tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <h3>🪚 طلبية الألواح</h3>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>الطول (سم)</th><th>العدد</th>
              <th>التكعيب (م³)</th><th>التكلفة (ج)</th>
            </tr></thead>
            <tbody>${plankRows || '<tr><td colspan="4">لا يوجد</td></tr>'}</tbody>
          </table>
        </div>
      </div>

      <div class="card totals">
        <h3>📊 الإجماليات</h3>
        <div class="row"><label>عدد العروق الكلي</label><span>${order.totalBeamCount}</span></div>
        <div class="row"><label>عدد الألواح الكلي</label><span>${order.totalPlankCount}</span></div>
        ${order.totalJointCount ? `<div class="row"><label>عدد الوصلات</label><span>${order.totalJointCount}</span></div>` : ''}
        <div class="row"><label>تكعيب العروق</label><span>${UI.fmt(order.totalBeamVol,4)} م³</span></div>
        <div class="row"><label>تكعيب الألواح</label><span>${UI.fmt(order.totalPlankVol,4)} م³</span></div>
        <div class="row"><label>إجمالي التكعيب</label><span>${UI.fmt(order.totalVol,4)} م³</span></div>
        <div class="row"><label>تكلفة العروق</label><span>${UI.fmt(order.totalBeamCost,0)} ج</span></div>
        <div class="row"><label>تكلفة الألواح</label><span>${UI.fmt(order.totalPlankCost,0)} ج</span></div>
        <div class="row"><label>الإجمالي النهائي</label><span>${UI.fmt(order.totalCost,0)} ج</span></div>
      </div>
    `;
  }

  function init(){ render(); }

  return { init, render };
})();