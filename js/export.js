/* ═══════════════════════════════════════════════
   EXPORT — PDF + Excel + المشاركة
   ═══════════════════════════════════════════════ */
window.Export = (function(){

  let pendingAction = null;

  /* ═══════════════════════════════════════════════
     سؤال التكلفة
     ═══════════════════════════════════════════════ */
  function askCost(){
    return new Promise((resolve) => {
      pendingAction = resolve;
      UI.showModal('cost-modal');
    });
  }

  function resolveCost(includeCost){
    UI.hideModal('cost-modal');
    if(pendingAction){
      pendingAction(includeCost);
      pendingAction = null;
    }
  }

  /* ═══════════════════════════════════════════════
     الهيدر
     ═══════════════════════════════════════════════ */
  function reportHeaderHtml(title, subtitle){
    const s = State.get();
    return `
      <div class="print-header">
        <h1>${UI.esc(title)}</h1>
        ${subtitle ? `<div class="print-sub" style="margin:4px 0">${UI.esc(subtitle)}</div>` : ''}
        <div class="print-convoy">قافلة: ${UI.esc(s.convoy || '—')}</div>
        <div class="print-team">فريق: ${UI.esc(s.team || '—')}</div>
        <div class="print-managers">
          📞 ${UI.esc(s.mgr1?.name || '—')}: ${UI.esc(s.mgr1?.phone || '—')}
          &nbsp;|&nbsp;
          📞 ${UI.esc(s.mgr2?.name || '—')}: ${UI.esc(s.mgr2?.phone || '—')}
        </div>
      </div>
      <div class="print-meta">
        <span>التاريخ: ${UI.todayStr()}</span>
        <span>عدد الأسقف: ${(State.get().cases || []).length}</span>
        <span>عدد الحالات: ${Calc.groupCases(State.get().cases || []).length}</span>
      </div>
    `;
  }

  function reportHeaderCompact(title, subtitle){
    const s = State.get();
    const casesCount = (State.get().cases || []).length;
    const groupsCount = Calc.groupCases(State.get().cases || []).length;

    return `
      <div class="print-header-compact">
        <h1>${UI.esc(title)}</h1>
        ${subtitle ? `<div class="print-sub" style="margin:2px 0 6px">${UI.esc(subtitle)}</div>` : ''}
        <div class="print-header-2col">

          <div class="ph2-right">
            <div class="ph2-row"><b>قافلة:</b> <span>${UI.esc(s.convoy || '—')}</span></div>
            <div class="ph2-row"><b>فريق:</b> <span>${UI.esc(s.team || '—')}</span></div>
            <div class="ph2-row">
              <b>📞</b>
              <span>${UI.esc(s.mgr1?.name || '—')}: ${UI.esc(s.mgr1?.phone || '—')}</span>
            </div>
            <div class="ph2-row">
              <b>📞</b>
              <span>${UI.esc(s.mgr2?.name || '—')}: ${UI.esc(s.mgr2?.phone || '—')}</span>
            </div>
          </div>

          <div class="ph2-left">
            <div class="ph2-row"><b>التاريخ:</b> <span>${UI.todayStr()}</span></div>
            <div class="ph2-row"><b>عدد الأسقف:</b> <span>${casesCount}</span></div>
            <div class="ph2-row"><b>عدد الحالات:</b> <span>${groupsCount}</span></div>
          </div>

        </div>
      </div>
    `;
  }

  /* ═══════════════════════════════════════════════
     الطباعة
     ═══════════════════════════════════════════════ */
  function showPrint(html){
    document.getElementById('print-area').innerHTML = html;
    setTimeout(() => window.print(), 200);
  }

  /* ═══════════════════════════════════════════════
     1) تفاصيل الأسقف — طباعة
     ═══════════════════════════════════════════════ */
  async function printDetails(){
    const s = State.get();
    const cases = s.cases || [];
    if(!cases.length) return UI.toast('لا توجد بيانات');
  
    await askCost();
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
            <div class="cbh-tools-title">🔨🪚 العدة</div>
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
  
    let blocks = '';
    calcs.forEach((r, i) => {
      blocks += `
        <div class="ceiling-block-h">
          <!-- الهيدر -->
          <div class="cbh-header">
            <span>سقف رقم ${i+1} — ${UI.esc(r.name)} ${r.code ? `[${UI.esc(r.code)}]` : ''}</span>
            <span class="cbh-subtitle">قافلة: ${UI.esc(s.convoy || '—')} &nbsp;|&nbsp; فريق: ${UI.esc(s.team || '—')}</span>
          </div>
          
          <!-- الجسم: عمودان رئيسيان -->
          <div class="cbh-body cbh-2cols">
            
            <!-- العمود الأيمن: بيانات + عدة + مسؤولين -->
            <div class="cbh-right-group">
              <div class="cbh-top-row">
                <div class="cbh-data">
                  <div class="cbh-field"><span>أبعاد الغرفة</span><b>${UI.fmt(r.D,0)} × ${UI.fmt(r.E,0)} سم</b></div>
                  <div class="cbh-field"><span>مواصفة العرق</span><b>${r.beamH} × ${r.beamW} سم</b></div>
                  <div class="cbh-field"><span>عدد العروق × الطول</span><b>${r.F} × ${r.G} سم</b></div>
                  <div class="cbh-field"><span>عدد الألواح × الطول</span><b>${r.H} × ${r.I} سم</b></div>
                  ${r.J ? `<div class="cbh-field"><span>الوصلة </span><b>${r.H} × ${r.J} سم</b></div>` : ''}
                </div>
                ${toolsHtml}
              </div>
  
              <!-- أرقام المسؤولين أسفل البيانات والعدة -->
              <div class="cbh-managers">
                <div class="cbh-manager-row">
                  <span class="mgr-label">📞 مسؤول القافلة</span>
                  <span class="mgr-name">${UI.esc(s.mgr1?.name || '—')}</span>
                  <span class="cbh-ph">${UI.esc(s.mgr1?.phone || '—')}</span>
                </div>
                <div class="cbh-manager-row">
                  <span class="mgr-label">📞 مسؤول الأسقف</span>                
                  <span class="mgr-name">${UI.esc(s.mgr2?.name || '—')}</span>
                  <span class="cbh-ph">${UI.esc(s.mgr2?.phone || '—')}</span>
                </div>
              </div>
            </div>
  
            <!-- العمود الأيسر: فريق التنفيذ (يمتد بالطول) -->
            <div class="cbh-team">
              <div class="cbh-team-title">👷 فريق التنفيذ</div>
              <div class="cbh-team-lines">
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
        </div>
      `;
    });
  
    const html = `
      <div class="print-doc">
        ${blocks}
      </div>
    `;
    showPrint(html);
  }

  async function shareDetails(){
    const s = State.get();
    const cases = s.cases || [];
    if(!cases.length) return UI.toast('لا توجد بيانات');

    const includeCost = await askCost();
    const calcs = Calc.calcAll(cases, s.beamSpecs, s.plankSpec);

    let txt = `🏠 *تفاصيل الأسقف*\n`;
    txt += `━━━━━━━━━━━━━━━━\n`;
    txt += `قافلة: ${s.convoy}\nفريق: ${s.team}\n`;
    txt += `📞 ${s.mgr1?.name||'—'}: ${s.mgr1?.phone||'—'}\n`;
    txt += `📞 ${s.mgr2?.name||'—'}: ${s.mgr2?.phone||'—'}\n`;
    txt += `التاريخ: ${UI.todayStr()}\n`;
    txt += `━━━━━━━━━━━━━━━━\n\n`;

    calcs.forEach((r, i) => {
      txt += `*${i+1}. ${r.name}* ${r.code?`[${r.code}]`:''}\n`;
      txt += `   📐 ${UI.fmt(r.D,0)}×${UI.fmt(r.E,0)} سم\n`;
      txt += `   🪵 عرق ${r.beamH}×${r.beamW}: ${r.F} × ${r.G} سم\n`;
      txt += `   🪚 ألواح: ${r.H} × ${r.I} سم\n`;
      if(r.J) txt += `   🔗 وصلات: ${r.H} × ${r.J} سم\n`;
      if(includeCost){
        txt += `   💰 ${UI.fmt(r.totalCost,0)} ج\n`;
      }
      txt += `\n`;
    });

    doShare(txt);
  }

  /* ═══════════════════════════════════════════════
     2) توزيع الخشب — طباعة
     ═══════════════════════════════════════════════ */
  async function printDistribution(){
    const s = State.get();
    const cases = s.cases || [];
    if(!cases.length) return UI.toast('لا توجد بيانات');
  
    await askCost();
  
    // التحقق من حالة زر الدمج
    const isMerged = window.Distribution ? window.Distribution.getIsMerged() : true;
  
    let maxBeamGroups = 0;
    let groupData = [];
  
    if (isMerged) {
      // ─── الوضع الحالي: دمج كل الحالات ───
      const groups = Calc.groupCases(cases);
      groupData = groups.map(g => {
        const cg = Calc.calcGroup(g, s.beamSpecs, s.plankSpec);
        const beamGroupsArr = Object.values(cg.beamGroups);
        maxBeamGroups = Math.max(maxBeamGroups, beamGroupsArr.length);
  
        const beamRows = beamGroupsArr.map(bg => ({
          spec: `${bg.height}×${bg.width}`,
          lengths: bg.lengths
        }));
        if(!beamRows.length) beamRows.push({ spec:'—', lengths:{} });
  
        return {
          code: g.code,
          name: g.name,
          count: g.ceilings.length,
          beamRows,
          plankLens: cg.plankLens,
          jointLens: cg.jointLens
        };
      });
    } else {
      // ─── الوضع الجديد: فصل الأسقف ───
      groupData = cases.map(c => {
        const r = Calc.calcCeiling(c, s.beamSpecs, s.plankSpec);
        
        const beamRows = [];
        if (r.beamH && r.beamW && r.G >= 100) {
          beamRows.push({
            spec: `${r.beamH}×${r.beamW}`,
            lengths: { [r.G]: r.F }
          });
          maxBeamGroups = Math.max(maxBeamGroups, 1);
        } else {
          beamRows.push({ spec:'—', lengths:{} });
        }
  
        return {
          code: r.code,
          name: r.name,
          count: 1,
          beamRows,
          plankLens: r.I >= 100 ? { [r.I]: r.H } : {},
          jointLens: (r.J && r.J >= 100) ? { [r.J]: r.H } : {}
        };
      });
    }
  
    let headCells = `
      <th style="width:8%">الكود</th>
      <th style="width:18%">الاسم</th>
      <th style="width:15%">الألواح<br>(عدد × طول)</th>
      <th style="width:12%">الوصلة<br>(عدد × طول)</th>
    `;
    for(let i = 0; i < maxBeamGroups; i++){
      headCells += `<th style="width:${Math.floor(30/maxBeamGroups)}%">العروق<br>${maxBeamGroups > 1 ? `(مجموعة ${i+1})` : '(عدد × طول)'}</th>`;
    }
  
    let bodyRows = '';
  
    groupData.forEach(g => {
      const rowsCount = g.beamRows.length;
  
      const planksStr = Object.keys(g.plankLens).map(Number).sort((a,b)=>a-b)
        .map(l => `${g.plankLens[l]}×${l}`).join(' ، ') || '—';
      const jointsStr = Object.keys(g.jointLens).map(Number).sort((a,b)=>a-b)
        .map(l => `${g.jointLens[l]}×${l}`).join(' ، ') || '—';
  
      g.beamRows.forEach((row, ri) => {
        bodyRows += '<tr>';
  
        if(ri === 0){
          bodyRows += `
            <td class="dt-code" rowspan="${rowsCount}">${UI.esc(g.code || '—')}</td>
            <td class="dt-name" rowspan="${rowsCount}">
              ${UI.esc(g.name)}
              ${g.count > 1 ? `<div style="font-size:9px;color:#718096;font-weight:400;margin-top:2px">${g.count} سقف</div>` : ''}
            </td>
            <td class="dt-cell" rowspan="${rowsCount}">${planksStr}</td>
            <td class="dt-cell" rowspan="${rowsCount}">${jointsStr}</td>
          `;
        }
  
        const beamItems = Object.keys(row.lengths).map(Number).sort((a,b)=>a-b)
          .map(l => `<span class="dt-item">${row.lengths[l]} × ${l} سم</span>`).join('') || '<span class="dt-empty">—</span>';
  
        bodyRows += `
          <td class="dt-cell">
            <span class="dt-spec">${row.spec}</span>
            ${beamItems}
          </td>
        `;
  
        for(let k = 1; k < maxBeamGroups; k++){
          const otherRow = g.beamRows[ri + k];
          if(otherRow){
            const items = Object.keys(otherRow.lengths).map(Number).sort((a,b)=>a-b)
              .map(l => `<span class="dt-item">${otherRow.lengths[l]} × ${l} سم</span>`).join('') || '<span class="dt-empty">—</span>';
            bodyRows += `
              <td class="dt-cell">
                <span class="dt-spec">${otherRow.spec}</span>
                ${items}
              </td>
            `;
          } else {
            bodyRows += `<td class="dt-cell dt-empty">—</td>`;
          }
        }
  
        bodyRows += '</tr>';
      });
    });
  
    const html = `
      <div class="print-doc">
        ${reportHeaderCompact(isMerged ? 'توزيع الخشب على الحالات (دمح)' : 'توزيع الخشب (فردي)', `${groupData.length} حالة — ${cases.length} سقف`)}
        <table class="dist-table">
          <thead>
            <tr>${headCells}</tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>
        <div class="footer">إعمار</div>
      </div>
    `;
    showPrint(html);
  }

  async function shareDistribution(){
    const s = State.get();
    const cases = s.cases || [];
    if(!cases.length) return UI.toast('لا توجد بيانات');

    const includeCost = await askCost();
    const groups = Calc.groupCases(cases);

    let txt = `📋 *توزيع الخشب على الحالات*\n`;
    txt += `━━━━━━━━━━━━━━━━\n`;
    txt += `قافلة: ${s.convoy}\nفريق: ${s.team}\n`;
    txt += `التاريخ: ${UI.todayStr()}\n`;
    txt += `━━━━━━━━━━━━━━━━\n\n`;

    groups.forEach((g, i) => {
      const cg = Calc.calcGroup(g, s.beamSpecs, s.plankSpec);
      const beamGroupsArr = Object.values(cg.beamGroups);

      txt += `*${i+1}. ${g.name}* ${g.code?`[${g.code}]`:''} — ${g.ceilings.length} سقف\n`;

      const plankLens = Object.keys(cg.plankLens).map(Number).sort((a,b)=>a-b);
      txt += `   🪚 ألواح: ${plankLens.map(l => `${cg.plankLens[l]}×${l}`).join(' ، ') || '—'}\n`;

      const jointLens = Object.keys(cg.jointLens).map(Number).sort((a,b)=>a-b);
      txt += `   🔗 وصلات: ${jointLens.map(l => `${cg.jointLens[l]}×${l}`).join(' ، ') || '—'}\n`;

      beamGroupsArr.forEach(bg => {
        const lens = Object.keys(bg.lengths).map(Number).sort((a,b)=>a-b);
        txt += `   🪵 ${bg.height}×${bg.width}: ${lens.map(l => `${bg.lengths[l]}×${l}`).join(' ، ')}\n`;
      });

      if(includeCost){
        txt += `   💰 ${UI.fmt(cg.totalCost || 0, 0)} ج\n`;
      }
      txt += `\n`;
    });

    doShare(txt);
  }

  /* ═══════════════════════════════════════════════
     3) الطلبية — طباعة
     ═══════════════════════════════════════════════ */
  async function printOrder(){
    const s = State.get();
    const cases = s.cases || [];
    if(!cases.length) return UI.toast('لا توجد بيانات');

    const includeCost = await askCost();
    const calcs = Calc.calcAll(cases, s.beamSpecs, s.plankSpec);
    const order = Calc.buildOrder(calcs, s.plankSpec);

    let beamRows = '';
    Object.values(order.beams).forEach(b => {
      Object.keys(b.lengths).map(Number).sort((a,b)=>a-b).forEach(len => {
        const qty = b.lengths[len];
        const vol = qty * len * (b.height*b.width) / 1e6;
        const cost = vol * b.price;
        beamRows += `
          <tr>
            <td>${b.height}×${b.width}</td>
            <td>${len}</td>
            <td>${qty}</td>
            <td>${UI.fmt(vol, 4)}</td>
            ${includeCost ? `<td>${UI.fmt(cost, 0)}</td>` : ''}
          </tr>
        `;
      });
    });

    let plankRows = '';
    Object.values(order.planks).sort((a,b)=>a.length-b.length).forEach(p => {
      plankRows += `
        <tr>
          <td>${p.length}</td>
          <td>${p.qty}</td>
          <td>${UI.fmt(p.vol, 4)}</td>
          ${includeCost ? `<td>${UI.fmt(p.cost, 0)}</td>` : ''}
        </tr>
      `;
    });

    const beamHead = includeCost
      ? '<th>المواصفة</th><th>الطول (سم)</th><th>العدد</th><th>التكعيب (م³)</th><th>التكلفة (ج)</th>'
      : '<th>المواصفة</th><th>الطول (سم)</th><th>العدد</th><th>التكعيب (م³)</th>';

    const plankHead = includeCost
      ? '<th>الطول (سم)</th><th>العدد</th><th>التكعيب (م³)</th><th>التكلفة (ج)</th>'
      : '<th>الطول (سم)</th><th>العدد</th><th>التكعيب (م³)</th>';

    const totalsBlock = `
      <div class="totals-print">
        <div class="tp-row"><span>عدد العروق الكلي</span><b>${order.totalBeamCount}</b></div>
        <div class="tp-row"><span>عدد الألواح الكلي</span><b>${order.totalPlankCount}</b></div>
        ${order.totalJointCount ? `<div class="tp-row"><span>عدد الوصلات</span><b>${order.totalJointCount}</b></div>` : ''}
        <div class="tp-row"><span>تكعيب العروق</span><b>${UI.fmt(order.totalBeamVol,4)} م³</b></div>
        <div class="tp-row"><span>تكعيب الألواح</span><b>${UI.fmt(order.totalPlankVol,4)} م³</b></div>
        <div class="tp-row"><span>إجمالي التكعيب</span><b>${UI.fmt(order.totalVol,4)} م³</b></div>
        ${includeCost ? `
          <div class="tp-row"><span>تكلفة العروق</span><b>${UI.fmt(order.totalBeamCost,0)} ج</b></div>
          <div class="tp-row"><span>تكلفة الألواح</span><b>${UI.fmt(order.totalPlankCost,0)} ج</b></div>
          <div class="tp-row"><span>الإجمالي النهائي</span><b>${UI.fmt(order.totalCost,0)} ج</b></div>
        ` : ''}
      </div>
    `;

    const html = `
      <div class="print-doc">
        ${reportHeaderHtml('ورقة الطلبية الإجمالية', includeCost ? 'شاملة التكلفة' : 'بدون تكلفة')}
        <table>
          <thead><tr><th colspan="${includeCost?5:4}">طلبية العروق</th></tr>
          <tr>${beamHead}</tr></thead>
          <tbody>${beamRows || `<tr><td colspan="${includeCost?5:4}">لا يوجد</td></tr>`}</tbody>
        </table>
        <table>
          <thead><tr><th colspan="${includeCost?4:3}">طلبية الألواح</th></tr>
          <tr>${plankHead}</tr></thead>
          <tbody>${plankRows || `<tr><td colspan="${includeCost?4:3}">لا يوجد</td></tr>`}</tbody>
        </table>
        ${totalsBlock}
        <div class="footer">إع</div>
      </div>
    `;
    showPrint(html);
  }

  async function shareOrder(){
    const s = State.get();
    const cases = s.cases || [];
    if(!cases.length) return UI.toast('لا توجد بيانات');

    const includeCost = await askCost();
    const calcs = Calc.calcAll(cases, s.beamSpecs, s.plankSpec);
    const order = Calc.buildOrder(calcs, s.plankSpec);

    let txt = `📦 *ورقة الطلبية*\n`;
    txt += `━━━━━━━━━━━━━━━━\n`;
    txt += `قافلة: ${s.convoy}\nفريق: ${s.team}\n`;
    txt += `التاريخ: ${UI.todayStr()}\n`;
    txt += `━━━━━━━━━━━━━━━━\n\n`;

    txt += `🪵 *طلبية العروق:*\n`;
    Object.values(order.beams).forEach(b => {
      txt += `▪️ مواصفة ${b.height}×${b.width}:\n`;
      Object.keys(b.lengths).map(Number).sort((a,b)=>a-b).forEach(len => {
        txt += `   • ${len} سم × ${b.lengths[len]}\n`;
      });
    });

    txt += `\n🪚 *طلبية الألواح:*\n`;
    Object.values(order.planks).sort((a,b)=>a.length-b.length).forEach(p => {
      txt += `   • ${p.length} سم × ${p.qty}\n`;
    });

    txt += `\n━━━━━━━━━━━━━━━━\n`;
    txt += `📊 عدد العروق: ${order.totalBeamCount}\n`;
    txt += `📊 عدد الألواح: ${order.totalPlankCount}\n`;
    if(order.totalJointCount) txt += `📊 عدد الوصلات: ${order.totalJointCount}\n`;
    txt += `📐 تكعيب العروق: ${UI.fmt(order.totalBeamVol,4)} م³\n`;
    txt += `📐 تكعيب الألواح: ${UI.fmt(order.totalPlankVol,4)} م³\n`;
    txt += `📐 إجمالي التكعيب: ${UI.fmt(order.totalVol,4)} م³\n`;

    if(includeCost){
      txt += `\n💰 تكلفة العروق: ${UI.fmt(order.totalBeamCost,0)} ج\n`;
      txt += `💰 تكلفة الألواح: ${UI.fmt(order.totalPlankCost,0)} ج\n`;
      txt += `*الإجمالي: ${UI.fmt(order.totalCost,0)} ج*\n`;
    }

    doShare(txt);
  }

  /* ═══════════════════════════════════════════════
     المشاركة العامة
     ═══════════════════════════════════════════════ */
  function doShare(txt){
    if(navigator.share){
      navigator.share({ title:'حساب أسقف الخشب', text: txt }).catch(() => {});
    } else {
      copyText(txt);
    }
  }

  function copyText(t){
    if(navigator.clipboard){
      navigator.clipboard.writeText(t)
        .then(() => UI.toast('✅ تم النسخ'))
        .catch(() => fallbackCopy(t));
    } else {
      fallbackCopy(t);
    }
  }

  function fallbackCopy(t){
    const ta = document.createElement('textarea');
    ta.value = t;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); UI.toast('✅ تم النسخ'); }
    catch(e) { UI.toast('⚠️ فشل النسخ'); }
    document.body.removeChild(ta);
  }

  /* ═══════════════════════════════════════════════
     المشاركة الشاملة
     ═══════════════════════════════════════════════ */
  async function shareAll(){
    const s = State.get();
    if(!(s.cases||[]).length) return UI.toast('لا توجد بيانات');

    const includeCost = await askCost();
    const cases = s.cases;
    const groups = Calc.groupCases(cases);
    const calcs = Calc.calcAll(cases, s.beamSpecs, s.plankSpec);
    const order = Calc.buildOrder(calcs, s.plankSpec);

    let txt = `🏠 *تقرير أسقف الخشب*\n`;
    txt += `━━━━━━━━━━━━━━━━\n`;
    txt += `قافلة: ${s.convoy}\nفريق: ${s.team}\n`;
    txt += `📞 ${s.mgr1?.name||'—'}: ${s.mgr1?.phone||'—'}\n`;
    txt += `📞 ${s.mgr2?.name||'—'}: ${s.mgr2?.phone||'—'}\n`;
    txt += `التاريخ: ${UI.todayStr()}\n`;
    txt += `━━━━━━━━━━━━━━━━\n\n`;

    txt += `📋 *توزيع الخشب على الحالات:*\n\n`;
    groups.forEach((g, i) => {
      const cg = Calc.calcGroup(g, s.beamSpecs, s.plankSpec);
      txt += `*${i+1}. ${g.name}* ${g.code?`[${g.code}]`:''} — ${g.ceilings.length} سقف\n`;
      const planks = Object.keys(cg.plankLens).map(Number).sort((a,b)=>a-b)
        .map(l => `${cg.plankLens[l]}×${l}`).join(' ، ');
      txt += `   🪚 ${planks || '—'}\n`;
      const joints = Object.keys(cg.jointLens).map(Number).sort((a,b)=>a-b)
        .map(l => `${cg.jointLens[l]}×${l}`).join(' ، ');
      txt += `   🔗 ${joints || '—'}\n`;
      Object.values(cg.beamGroups).forEach(bg => {
        const lens = Object.keys(bg.lengths).map(Number).sort((a,b)=>a-b)
          .map(l => `${bg.lengths[l]}×${l}`).join(' ، ');
        txt += `   🪵 ${bg.height}×${bg.width}: ${lens}\n`;
      });
      txt += `\n`;
    });

    txt += `━━━━━━━━━━━━━━━━\n📦 *الطلبية الإجمالية:*\n\n`;
    txt += `🪵 *عروق:*\n`;
    Object.values(order.beams).forEach(b => {
      txt += `▪️ ${b.height}×${b.width}:\n`;
      Object.keys(b.lengths).map(Number).sort((a,b)=>a-b).forEach(len => {
        txt += `   ${len} سم × ${b.lengths[len]}\n`;
      });
    });
    txt += `\n🪚 *ألواح:*\n`;
    Object.values(order.planks).sort((a,b)=>a.length-b.length).forEach(p => {
      txt += `   ${p.length} سم × ${p.qty}\n`;
    });

    txt += `\n━━━━━━━━━━━━━━━━\n`;
    txt += `📊 العروق: ${order.totalBeamCount} | الألواح: ${order.totalPlankCount}\n`;
    txt += `📐 التكعيب: ${UI.fmt(order.totalVol,4)} م³\n`;
    if(includeCost){
      txt += `\n💰 *الإجمالي: ${UI.fmt(order.totalCost,0)} ج*\n`;
    }

    doShare(txt);
  }

  return {
    askCost, resolveCost,
    printDetails, shareDetails,
    printDistribution, shareDistribution,
    printOrder, shareOrder,
    shareAll
  };
})();