/* ═══════════════════════════════════════════════
   DISTRIBUTION — جدول توزيع الخشب (صف واحد لكل حالة)
   ═══════════════════════════════════════════════ */
window.Distribution = (function(){

  let isMerged = true; // الوضع الافتراضي: دمج

  function toggleMerge(){
    isMerged = !isMerged;
    const btn = document.getElementById('btn-merge-dist');
    if(btn) {
      if(isMerged) {
        btn.innerHTML = '🔗 دمج الأسقف (مُفعل)';
        btn.style.borderColor = '#2f855a';
        btn.style.color = '#2f855a';
      } else {
        btn.innerHTML = '🔓 فصل الأسقف (مُعطل)';
        btn.style.borderColor = '#c05621';
        btn.style.color = '#c05621';
      }
    }
    render();
  }

  function buildRows(){
    const s = State.get();
    const groups = Calc.groupCases(s.cases || []);

    let maxBeamGroups = 0;
    let rows = [];

    if (isMerged) {
      // ─── الوضع الحالي: دمج كل الحالات في صف واحد ───
      rows = groups.map(g => {
        const cg = Calc.calcGroup(g, s.beamSpecs, s.plankSpec);
        const beamGroupsArr = Object.values(cg.beamGroups);
        maxBeamGroups = Math.max(maxBeamGroups, beamGroupsArr.length);

        return {
          code: g.code,
          name: g.name,
          count: g.ceilings.length,
          planks: cg.plankLens,
          joints: cg.jointLens,
          beams: beamGroupsArr,
          totalBeamQty: cg.totalBeamQty,
          totalPlankQty: cg.totalPlankQty,
          totalJointQty: cg.totalJointQty
        };
      });
    } else {
      // ─── الوضع الجديد: كل سقف في صف منفصل ───
      rows = (s.cases || []).map(c => {
        const r = Calc.calcCeiling(c, s.beamSpecs, s.plankSpec);
        
        // بناء بيانات العروق لهذا السقف فقط
        const beamGroupsArr = [];
        if (r.beamH && r.beamW && r.G >= 100) {
          beamGroupsArr.push({
            height: r.beamH,
            width: r.beamW,
            lengths: { [r.G]: r.F }
          });
          maxBeamGroups = Math.max(maxBeamGroups, 1);
        }

        return {
          code: r.code,
          name: r.name,
          count: 1,
          planks: r.I >= 100 ? { [r.I]: r.H } : {},
          joints: (r.J && r.J >= 100) ? { [r.J]: r.H } : {},
          beams: beamGroupsArr,
          totalBeamQty: r.F,
          totalPlankQty: r.H,
          totalJointQty: r.J ? r.H : 0
        };
      });
    }

    return { rows, maxBeamGroups: Math.max(1, maxBeamGroups) };
  }

  function fmtQtyLen(map){
    const keys = Object.keys(map).map(Number).sort((a,b)=>a-b);
    if(!keys.length) return '—';
    return keys.map(k => `<span class="spec-line">${map[k]} <span class="lbl">×</span> ${k} <span class="lbl">سم</span></span>`).join('');
  }

  function fmtBeamGroup(bg){
    if(!bg || !bg.lengths) return '—';
    const keys = Object.keys(bg.lengths).map(Number).sort((a,b)=>a-b);
    if(!keys.length) return '—';
    const specTag = `<span class="spec-line" style="color:#c05621;font-size:10px;margin-bottom:2px">${bg.height}×${bg.width} سم</span>`;
    const lengths = keys.map(k => `<span class="spec-line">${bg.lengths[k]} <span class="lbl">×</span> ${k} <span class="lbl">سم</span></span>`).join('');
    return specTag + lengths;
  }

  function render(){
    const s = State.get();
    const thead = document.getElementById('dist-thead-row');
    const tbody = document.querySelector('#dist-table tbody');
    const empty = document.getElementById('dist-empty');
    if(!thead || !tbody) return;

    const { rows, maxBeamGroups } = buildRows();
    if(empty) empty.style.display = rows.length ? 'none' : 'block';

    // ─── بناء الرأس ───
    let headHtml = `
      <th>الكود</th>
      <th>الاسم</th>
      <th>الألواح<br><small style="font-weight:400">(عدد × طول)</small></th>
      <th>الوصلة<br><small style="font-weight:400">(عدد × طول)</small></th>
      <th>العروق<br><small style="font-weight:400">(عدد × طول)</small></th>
    `;
    for(let i = 2; i <= maxBeamGroups; i++){
      headHtml += `<th>العروق${i}<br><small style="font-weight:400">(عدد × طول)</small></th>`;
    }
    thead.innerHTML = headHtml;

    // ─── بناء الصفوف ───
    tbody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');

      let html = `
        <td style="font-family:monospace;font-size:10px;color:#2c5282">${UI.esc(r.code || '—')}</td>
        <td style="text-align:right;padding-right:6px;font-weight:600">
          ${UI.esc(r.name)}
          ${(!isMerged || r.count > 1) ? `<div style="font-size:9px;color:#718096;font-weight:400">${r.count} سقف</div>` : ''}
        </td>
        <td class="dist-cell" style="background:#f0fff4">${fmtQtyLen(r.planks)}</td>
        <td class="dist-cell" style="background:#fffaf0">${fmtQtyLen(r.joints)}</td>
        <td class="dist-cell" style="background:#ebf8ff">${fmtBeamGroup(r.beams[0])}</td>
      `;
      for(let i = 1; i < maxBeamGroups; i++){
        html += `<td class="dist-cell" style="background:#ebf8ff">${fmtBeamGroup(r.beams[i])}</td>`;
      }
      tr.innerHTML = html;
      tbody.appendChild(tr);
    });
  }

  function init(){ render(); }

  return { init, render, toggleMerge, getIsMerged: () => isMerged };
})();