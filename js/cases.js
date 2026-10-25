/* ═══════════════════════════════════════════════
   CASES — إدارة الحالات + استيراد/تصدير Excel
   ═══════════════════════════════════════════════ */
window.Cases = (function(){

  const XLSX_CDN = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  const FILE_MARK = 'WOOD_CEILING_APP_V3';

  function loadXLSXLib(){
    if(window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise((resolve, reject) => {
      UI.toast('⏳ تحميل مكتبة Excel...');
      const load = (src, onfail) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve(window.XLSX);
        s.onerror = onfail;
        document.head.appendChild(s);
      };
      // النسخة المحلية أولاً (تعمل بدون إنترنت) ثم الشبكة
      load('lib/xlsx.full.min.js', () => load(XLSX_CDN,
        () => reject(new Error('فشل تحميل مكتبة Excel'))));
    });
  }

  /* ───── الإضافة ───── */
  async function addCase(){
    const code = document.getElementById('inp-code').value.trim();
    const name = document.getElementById('inp-name').value.trim();
    const length = parseFloat(document.getElementById('inp-length').value);
    const width  = parseFloat(document.getElementById('inp-width').value);

    if(!name) return UI.toast('⚠️ اكتب اسم الحالة');
    if(!length || length <= 0) return UI.toast('⚠️ طول غير صحيح');
    if(!width  || width  <= 0) return UI.toast('⚠️ عرض غير صحيح');

    State.addCase({ code, name, length, width });
    await State.save();

    ['inp-name','inp-length','inp-width'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('inp-name').focus();

    if(window.App) App.refreshAll();
    UI.toast('✅ تمت الإضافة');
  }

  /* ───── الرسم ───── */
  function render(){
    const s = State.get();
    const cases = s.cases || [];
    const tb = document.querySelector('#cases-table tbody');
    if(!tb) return;

    tb.innerHTML = '';

    const cntEl = document.getElementById('case-count');
    if(cntEl) cntEl.textContent = cases.length;
    const emptyEl = document.getElementById('cases-empty');
    if(emptyEl) emptyEl.style.display = cases.length ? 'none' : 'block';

    cases.forEach((c, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input class="code-inp" value="${UI.esc(c.code||'')}" data-i="${idx}" data-f="code" placeholder="—"></td>
        <td><input class="name-inp" value="${UI.esc(c.name||'')}" data-i="${idx}" data-f="name"></td>
        <td><input type="number" value="${c.length}" data-i="${idx}" data-f="length" inputmode="decimal"></td>
        <td><input type="number" value="${c.width}"  data-i="${idx}" data-f="width"  inputmode="decimal"></td>
        <td><button class="btn btn-danger btn-sm" data-del="${c.id}">✕</button></td>
      `;
      tb.appendChild(tr);
    });

    tb.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('change', async e => {
        const idx = Number(e.target.dataset.i);
        const f   = e.target.dataset.f;
        let v = e.target.value;
        if(f === 'length' || f === 'width'){
          const n = parseFloat(v);
          v = (!isNaN(n) && n > 0) ? n : 0;
        } else {
          v = String(v).trim();
        }
        State.updateCase(idx, f, v);
        await State.save();
        if(window.App) App.refreshAll();
      });
    });

    tb.querySelectorAll('button[data-del]').forEach(btn => {
      btn.addEventListener('click', async e => {
        const id = Number(e.target.dataset.del);
        if(!confirm('حذف هذا السقف؟')) return;
        State.deleteCase(id);
        await State.save();
        if(window.App) App.refreshAll();
        UI.toast('تم الحذف');
      });
    });
  }

  async function clearAll(){
    if(!(State.get().cases || []).length) return;
    if(!confirm('حذف كل الحالات؟')) return;
    State.clearCases();
    await State.save();
    if(window.App) App.refreshAll();
    UI.toast('تم الحذف');
  }

  /* ───── استيراد من نص ───── */
  function parseRows(text){
    const lines = text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(l => l.trim());
    const rows = [];
    for(const line of lines){
      let cells;
      if(line.includes('\t'))      cells = line.split('\t');
      else if(line.includes(','))  cells = csvLine(line);
      else if(line.includes(';'))  cells = line.split(';');
      else                         cells = [line];
      cells = cells.map(x => String(x).trim().replace(/^["']|["']$/g,''));
      if(cells.length < 3) continue;
      const hasNum = cells.some(x => /^\d+(\.\d+)?$/.test(x));
      if(!hasNum) continue;

      let code='', name='', length=0, width=0;
      if(cells.length >= 4){
        code = cells[0]; name = cells[1];
        length = parseFloat(cells[2]); width = parseFloat(cells[3]);
      } else {
        name = cells[0];
        length = parseFloat(cells[1]); width = parseFloat(cells[2]);
      }
      if(!name || isNaN(length) || isNaN(width) || length <= 0 || width <= 0) continue;
      rows.push({ code, name, length, width });
    }
    return rows;
  }

  function csvLine(line){
    const out=[]; let cur=''; let inQ=false;
    for(let i=0;i<line.length;i++){
      const c = line[i];
      if(inQ){
        if(c === '"' && line[i+1] === '"'){ cur += '"'; i++; }
        else if(c === '"') inQ = false;
        else cur += c;
      } else {
        if(c === '"') inQ = true;
        else if(c === ','){ out.push(cur); cur=''; }
        else cur += c;
      }
    }
    out.push(cur);
    return out;
  }

  async function importFromPaste(){
    const txt = document.getElementById('paste-area').value;
    if(!txt.trim()) return UI.toast('⚠️ الصق بيانات أولاً');
    const rows = parseRows(txt);
    if(!rows.length) return UI.toast('⚠️ لم يتم التعرف على صفوف صالحة');

    rows.forEach(r => State.addCase(r));
    await State.save();

    document.getElementById('paste-area').value = '';
    if(window.App) App.refreshAll();
    UI.toast(`✅ تم استيراد ${rows.length} سقف بنجاح`);
  }

  async function pasteFromClipboard(){
    try {
      if(!navigator.clipboard) throw new Error('no-clipboard');
      const text = await navigator.clipboard.readText();
      if(!text || !text.trim()) return UI.toast('⚠️ الحافظة فارغة');
      document.getElementById('paste-area').value = text;
      await importFromPaste();
    } catch(e) {
      UI.toast('⚠️ يرجى استخدام اللصق اليدوي (اضغط مطولاً في الصندوق واختر لصق)');
    }
  }

  /* ───── استيراد من ملف ───── */
  async function importFromFile(ev){
    const f = ev.target.files[0];
    if(!f) return;
    ev.target.value = '';
    const nm = f.name.toLowerCase();

    try{
      if(nm.endsWith('.csv') || nm.endsWith('.txt')){
        const text = await f.text();
        const rows = parseRows(text);
        if(!rows.length) return UI.toast('⚠️ لا يوجد صفوف صالحة');
        rows.forEach(r => State.addCase(r));
        await State.save();
        if(window.App) App.refreshAll();
        UI.toast(`✅ تم استيراد ${rows.length} سقف`);
        return;
      }

      const XLSX = await loadXLSXLib();
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type:'array' });

      const isOurFile = wb.SheetNames.includes('_meta') &&
        JSON.stringify(XLSX.utils.sheet_to_json(wb.Sheets['_meta'], { header:1 })).includes(FILE_MARK);

      if(isOurFile){
        // استعادة كاملة (مبسط)
        if(wb.Sheets['المواصفات']){
          const specData = XLSX.utils.sheet_to_json(wb.Sheets['المواصفات'], { header:1, defval:'' });
          const beamSpecs = [];
          let plankSpec = null;
          let inBeams = false, inPlanks = false;
          specData.forEach(row => {
            if(!row || !row.length) return;
            const first = String(row[0]||'').trim();
            if(first === 'مواصفات العروق'){ inBeams = true; inPlanks = false; return; }
            if(first === 'مواصفة الألواح'){ inBeams = false; inPlanks = true; return; }
            if(first === 'الارتفاع' || first === 'العرض' || first === 'البيان') return;
            if(inBeams && row.length >= 5){
              beamSpecs.push({
                height: parseFloat(row[0])||0,
                width:  parseFloat(row[1])||0,
                price:  parseFloat(row[2])||0,
                fromLen: parseFloat(row[3])||0,
                toLen:   parseFloat(row[4])||0
              });
            } else if(inPlanks && row.length >= 2){
              const k = String(row[0]||'').trim();
              const v = parseFloat(row[1])||0;
              if(!plankSpec) plankSpec = {};
              if(k.includes('عرض')) plankSpec.width = v;
              else if(k.includes('سمك')) plankSpec.thickness = v;
              else if(k.includes('سعر')) plankSpec.price = v;
            }
          });
          if(beamSpecs.length || plankSpec){
            const s = State.get();
            if(beamSpecs.length){
              s.beamSpecs = beamSpecs.map((x,i) => ({ ...x, id: i+1 }));
              s.specIdSeq = beamSpecs.length + 1;
            }
            if(plankSpec) s.plankSpec = Object.assign({}, s.plankSpec, plankSpec);
            await State.save();
          }
        }

        if(wb.Sheets['_meta']){
          const metaData = XLSX.utils.sheet_to_json(wb.Sheets['_meta'], { header:1, defval:'' });
          const conv = metaData.find(r => r[0] === 'convoy');
          const team = metaData.find(r => r[0] === 'team');
          const m1n  = metaData.find(r => r[0] === 'mgr1_name');
          const m1p  = metaData.find(r => r[0] === 'mgr1_phone');
          const m2n  = metaData.find(r => r[0] === 'mgr2_name');
          const m2p  = metaData.find(r => r[0] === 'mgr2_phone');
          const s = State.get();
          if(conv) s.convoy = String(conv[1]||'');
          if(team) s.team   = String(team[1]||'');
          if(m1n || m1p) s.mgr1 = { name: String(m1n?.[1]||''), phone: String(m1p?.[1]||'') };
          if(m2n || m2p) s.mgr2 = { name: String(m2n?.[1]||''), phone: String(m2p?.[1]||'') };
          await State.save();
          Setup.updateHeader();
        }

        const casesSheet = wb.Sheets['الحالات'] ||
                          wb.Sheets[wb.SheetNames.find(n => !n.startsWith('_'))];
        const data = XLSX.utils.sheet_to_json(casesSheet, { header:1, defval:'' });
        const rows = [];
        for(let i = 1; i < data.length; i++){
          const r = data[i];
          if(!r || r.length < 3) continue;
          const cells = r.map(x => String(x).trim());
          const hasNum = cells.some(x => /^\d+(\.\d+)?$/.test(x));
          if(!hasNum) continue;
          let code='', name='', length=0, width=0;
          if(cells.length >= 4){
            code = cells[0]; name = cells[1];
            length = parseFloat(cells[2]); width = parseFloat(cells[3]);
          } else {
            name = cells[0]; length = parseFloat(cells[1]); width = parseFloat(cells[2]);
          }
          if(!name || isNaN(length) || isNaN(width) || length <= 0 || width <= 0) continue;
          rows.push({ code, name, length, width });
        }
        if(!rows.length) return UI.toast('⚠️ لا توجد حالات في الملف');

        rows.forEach(r => State.addCase(r));
        await State.save();
        if(window.App) App.refreshAll();
        UI.toast(`✅ إضافة ${rows.length} سقف`);
        return;
      }

      // XLSX عادي
      const allRows = [];
      wb.SheetNames.forEach(sn => {
        const ws = wb.Sheets[sn];
        const data = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
        for(const r of data){
          if(!r || r.length < 3) continue;
          const cells = r.map(x => String(x).trim());
          const hasNum = cells.some(x => /^\d+(\.\d+)?$/.test(x));
          if(!hasNum) continue;
          let code='', name='', length=0, width=0;
          if(cells.length >= 4){
            code = cells[0]; name = cells[1];
            length = parseFloat(cells[2]); width = parseFloat(cells[3]);
          } else {
            name = cells[0]; length = parseFloat(cells[1]); width = parseFloat(cells[2]);
          }
          if(!name || isNaN(length) || isNaN(width) || length <= 0 || width <= 0) continue;
          allRows.push({ code, name, length, width });
        }
      });
      if(!allRows.length) return UI.toast('⚠️ لم يتم العثور على صفوف صالحة');
      allRows.forEach(r => State.addCase(r));
      await State.save();
      if(window.App) App.refreshAll();
      UI.toast(`✅ تم استيراد ${allRows.length} سقف`);

    } catch(e){
      console.error(e);
      UI.toast('⚠️ فشل الاستيراد — ' + e.message);
    }
  }

  /* ───── تصدير Excel ───── */
  async function exportXLSX(){
    const s = State.get();
    if(!(s.cases||[]).length) return UI.toast('لا توجد بيانات للتصدير');

    try{
      const XLSX = await loadXLSXLib();
      const wb = XLSX.utils.book_new();
      const dateStr = UI.todayISO();

      const metaAoa = [
        [FILE_MARK],
        ['exported_at', new Date().toISOString()],
        ['version', '3.0'],
        ['app', 'حساب أسقف الخشب'],
        ['convoy', s.convoy || ''],
        ['team', s.team || ''],
        ['mgr1_name', s.mgr1?.name || ''],
        ['mgr1_phone', s.mgr1?.phone || ''],
        ['mgr2_name', s.mgr2?.name || ''],
        ['mgr2_phone', s.mgr2?.phone || '']
      ];
      const wsMeta = XLSX.utils.aoa_to_sheet(metaAoa);
      wsMeta['!cols'] = [{wch:25},{wch:30}];
      XLSX.utils.book_append_sheet(wb, wsMeta, '_meta');

      const specAoa = [['مواصفات العروق'],['الارتفاع','العرض','السعر','من طول','إلى طول']];
      (s.beamSpecs||[]).slice().sort((a,b)=>(a.fromLen||0)-(b.fromLen||0))
        .forEach(x => specAoa.push([x.height, x.width, x.price, x.fromLen, x.toLen]));
      specAoa.push([]);
      specAoa.push(['مواصفة الألواح']);
      specAoa.push(['عرض اللوح (مم)', s.plankSpec.width]);
      specAoa.push(['سمك اللوح (مم)', s.plankSpec.thickness]);
      specAoa.push(['سعر اللوح (ج/م³)', s.plankSpec.price]);
      const wsSpec = XLSX.utils.aoa_to_sheet(specAoa);
      wsSpec['!cols'] = [{wch:22},{wch:14},{wch:14},{wch:14},{wch:14}];
      XLSX.utils.book_append_sheet(wb, wsSpec, 'المواصفات');

      const casesAoa = [['الكود','الاسم','الطول','العرض']];
      (s.cases||[]).forEach(c => casesAoa.push([c.code||'', c.name, c.length, c.width]));
      const wsCases = XLSX.utils.aoa_to_sheet(casesAoa);
      wsCases['!cols'] = [{wch:12},{wch:28},{wch:10},{wch:10}];
      XLSX.utils.book_append_sheet(wb, wsCases, 'الحالات');

      const calcs = Calc.calcAll(s.cases, s.beamSpecs, s.plankSpec);
      const calcAoa = [[
        'م','الكود','الاسم','الطول','العرض',
        'عدد العروق','طول العرق','مواصفة العرق',
        'عدد الألواح','طول اللوح','طول الوصلة',
        'تكعيب العروق','تكعيب الألواح','التكلفة'
      ]];
      calcs.forEach((r,i) => calcAoa.push([
        i+1, r.code, r.name, r.D, r.E,
        r.F, r.G, `${r.beamH}×${r.beamW}`,
        r.H, r.I, r.J||'',
        +r.L.toFixed(4), +r.M.toFixed(4), Math.round(r.totalCost)
      ]));
      const wsCalc = XLSX.utils.aoa_to_sheet(calcAoa);
      wsCalc['!cols'] = [{wch:5},{wch:10},{wch:20},{wch:8},{wch:8},{wch:9},{wch:9},{wch:12},{wch:9},{wch:9},{wch:9},{wch:12},{wch:12},{wch:12}];
      XLSX.utils.book_append_sheet(wb, wsCalc, 'الحساب');

      const order = Calc.buildOrder(calcs, s.plankSpec);
      const orderAoa = [['طلبية العروق']];
      orderAoa.push(['المواصفة','الطول (سم)','العدد','التكعيب (م³)','التكلفة (ج)']);
      Object.values(order.beams).forEach(b => {
        Object.keys(b.lengths).map(Number).sort((a,b)=>a-b).forEach(len => {
          const qty = b.lengths[len];
          const vol = qty * len * (b.height*b.width) / 1e6;
          const cost = vol * b.price;
          orderAoa.push([`${b.height}×${b.width}`, len, qty, +vol.toFixed(4), Math.round(cost)]);
        });
      });
      orderAoa.push([]);
      orderAoa.push(['طلبية الألواح']);
      orderAoa.push(['الطول (سم)','العدد','التكعيب (م³)','التكلفة (ج)']);
      Object.values(order.planks).sort((a,b)=>a.length-b.length).forEach(p => {
        orderAoa.push([p.length, p.qty, +p.vol.toFixed(4), Math.round(p.cost)]);
      });
      orderAoa.push([]);
      orderAoa.push(['الإجماليات']);
      orderAoa.push(['عدد العروق', order.totalBeamCount]);
      orderAoa.push(['عدد الألواح', order.totalPlankCount]);
      orderAoa.push(['تكعيب العروق', +order.totalBeamVol.toFixed(4)]);
      orderAoa.push(['تكعيب الألواح', +order.totalPlankVol.toFixed(4)]);
      orderAoa.push(['إجمالي التكعيب', +order.totalVol.toFixed(4)]);
      orderAoa.push(['تكلفة العروق', Math.round(order.totalBeamCost)]);
      orderAoa.push(['تكلفة الألواح', Math.round(order.totalPlankCost)]);
      orderAoa.push(['الإجمالي', Math.round(order.totalCost)]);
      const wsOrder = XLSX.utils.aoa_to_sheet(orderAoa);
      wsOrder['!cols'] = [{wch:14},{wch:12},{wch:10},{wch:14},{wch:14}];
      XLSX.utils.book_append_sheet(wb, wsOrder, 'الطلبية');

      const wbout = XLSX.write(wb, { bookType:'xlsx', type:'array' });
      const blob = new Blob([wbout], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const safeConvoy = (s.convoy||'قافلة').replace(/[\\/:*?"<>|]/g,'_');
      await Native.saveFile(blob, `${safeConvoy}_${dateStr}.xlsx`);
      UI.toast('✅ تم تصدير الملف');
    } catch(e){
      console.error(e);
      UI.toast('⚠️ فشل التصدير — ' + e.message);
    }
  }

  async function exportCSV(){
    const s = State.get();
    if(!(s.cases||[]).length) return UI.toast('لا توجد بيانات');
    const lines = ['الكود,الاسم,الطول,العرض'];
    s.cases.forEach(c => lines.push(`"${c.code||''}","${c.name}",${c.length},${c.width}`));
    const blob = new Blob(['\uFEFF'+lines.join('\n')], {type:'text/csv;charset=utf-8'});
    await Native.saveFile(blob, `الحالات_${UI.todayISO()}.csv`);
    UI.toast('💾 تم تنزيل CSV');
  }

  function init(){
    render();
    ['inp-code','inp-name','inp-length','inp-width'].forEach((id, i, arr) => {
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('keypress', e => {
        if(e.key === 'Enter'){
          if(i < arr.length - 1) document.getElementById(arr[i+1]).focus();
          else addCase();
        }
      });
    });
  }

  return {
    init, render, addCase, clearAll,
    importFromPaste, importFromFile, exportXLSX, exportCSV,
    pasteFromClipboard
  };
})();