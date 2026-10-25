/* ═══════════════════════════════════════════════
   CALC-VIEW — جدول الحساب التفصيلي
   ═══════════════════════════════════════════════ */
window.CalcView = (function(){

  function render(){
    const s = State.get();
    const cases = s.cases || [];
    const tb = document.querySelector('#calc-table tbody');
    if(!tb) return;
    tb.innerHTML = '';

    const empty = document.getElementById('calc-empty');
    if(empty) empty.style.display = cases.length ? 'none' : 'block';

    if(!cases.length) return;

    const calcs = Calc.calcAll(cases, s.beamSpecs, s.plankSpec);

    // الألوان حسب مواصفة العرق
    const specColors = ['#2c5282','#c05621','#2f855a','#6b46c1','#b83280'];
    const allSpecKeys = [...new Set(calcs.map(x => `${x.beamH}×${x.beamW}`))];

    calcs.forEach((r, i) => {
      const tr = document.createElement('tr');

      const specKey = `${r.beamH}×${r.beamW}`;
      const colorIdx = allSpecKeys.indexOf(specKey) % specColors.length;
      const specColor = r.beamH ? specColors[colorIdx] : '#a0aec0';

      tr.innerHTML = `
        <td>${i+1}</td>
        <td style="font-family:monospace;font-size:10px;color:#2c5282">${UI.esc(r.code||'—')}</td>
        <td style="text-align:right;padding-right:6px;font-weight:600">${UI.esc(r.name)}</td>
        <td>${UI.fmt(r.D,0)}</td>
        <td>${UI.fmt(r.E,0)}</td>
        <td>${r.F}</td>
        <td>${r.G}</td>
        <td style="color:${specColor};font-weight:700;font-size:11px">${r.beamH}×${r.beamW}</td>
        <td>${r.H}</td>
        <td>${r.I}</td>
        <td>${r.J ?? '-'}</td>
        <td>${UI.fmt(r.L,4)}</td>
        <td>${UI.fmt(r.M,4)}</td>
        <td>${UI.fmt(r.totalCost,0)}</td>
      `;
      tb.appendChild(tr);
    });
  }

  function init(){ render(); }

  return { init, render };
})();