/* ═══════════════════════════════════════════════
   SPECS — إدارة مواصفات العروق والألواح
   ═══════════════════════════════════════════════ */
window.Specs = (function(){

  function renderBeamSpecs(){
    const s = State.get();
    const specs = (s.beamSpecs || []).slice().sort(
      (a,b) => (a.fromLen||0) - (b.fromLen||0)
    );

    const tb = document.querySelector('#beam-specs-table tbody');
    if(!tb) return;
    tb.innerHTML = '';

    const cnt = document.getElementById('beam-spec-count');
    if(cnt) cnt.textContent = specs.length;

    if(!specs.length){
      tb.innerHTML = `<tr><td colspan="6" style="padding:14px;color:#a0aec0">لا توجد مواصفات — أضف واحدة</td></tr>`;
      return;
    }

    specs.forEach(sp => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="number" step="0.1" value="${sp.height||0}" data-id="${sp.id}" data-f="height" inputmode="decimal"></td>
        <td><input type="number" step="0.1" value="${sp.width||0}"  data-id="${sp.id}" data-f="width"  inputmode="decimal"></td>
        <td><input type="number" value="${sp.price||0}"             data-id="${sp.id}" data-f="price"  inputmode="decimal"></td>
        <td><input type="number" value="${sp.fromLen||0}"           data-id="${sp.id}" data-f="fromLen" inputmode="decimal"></td>
        <td><input type="number" value="${sp.toLen||0}"             data-id="${sp.id}" data-f="toLen"  inputmode="decimal"></td>
        <td><button class="btn btn-danger btn-sm" data-del="${sp.id}">✕</button></td>
      `;
      tb.appendChild(tr);
    });

    tb.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('change', async e => {
        const id = Number(e.target.dataset.id);
        const f  = e.target.dataset.f;
        const v  = parseFloat(e.target.value) || 0;
        State.updateBeamSpec(id, f, v);
        await State.save();
        if(window.App) App.refreshAll();
      });
    });
    tb.querySelectorAll('button[data-del]').forEach(btn => {
      btn.addEventListener('click', async e => {
        const id = Number(e.target.dataset.del);
        if(!confirm('حذف هذه المواصفة؟')) return;
        State.deleteBeamSpec(id);
        await State.save();
        if(window.App) App.refreshAll();
        UI.toast('تم الحذف');
      });
    });
  }

  async function addBeamSpec(){
    const s = State.get();
    const specs = (s.beamSpecs || []).slice().sort((a,b)=>(a.toLen||0)-(b.toLen||0));
    let fromLen = 0;
    if(specs.length){
      const last = specs[specs.length-1];
      fromLen = (Number(last.toLen)||0) + 1;
    }
    const newSpec = {
      height: 12.5,
      width: 7,
      price: s.beamSpecs?.[0]?.price || 18500,
      fromLen,
      toLen: fromLen + 999
    };
    State.addBeamSpec(newSpec);
    await State.save();
    if(window.App) App.refreshAll();
    UI.toast('➕ أُضيفت مواصفة جديدة');
  }

  async function resetBeamSpecs(){
    if(!confirm('استعادة المواصفات الافتراضية؟')) return;
    const s = State.get();
    s.beamSpecs = [
      { id: 1, height: 9,    width: 5, price: 18500, fromLen: 0,   toLen: 599   },
      { id: 2, height: 12.5, width: 7, price: 18500, fromLen: 600, toLen: 99999 }
    ];
    s.specIdSeq = 3;
    await State.save();
    if(window.App) App.refreshAll();
    UI.toast('↺ تم الاستعادة');
  }

  function renderPlankSpec(){
    const s = State.get();
    const p = s.plankSpec || {};

    const wEl = document.getElementById('spec-plank-w');
    const tEl = document.getElementById('spec-plank-t');
    const pEl = document.getElementById('spec-plank-price');
    const aEl = document.getElementById('spec-plank-area');
    if(!wEl) return;

    wEl.value = p.width || 0;
    tEl.value = p.thickness || 0;
    pEl.value = p.price || 0;
    aEl.value = UI.fmt((p.width||0) * (p.thickness||0) / 100) + ' سم²';

    [wEl, tEl, pEl].forEach(el => {
      el.onchange = async () => {
        const w = parseFloat(wEl.value) || 0;
        const t = parseFloat(tEl.value) || 0;
        const pr = parseFloat(pEl.value) || 0;
        p.width = w; p.thickness = t; p.price = pr;
        aEl.value = UI.fmt(w * t / 100) + ' سم²';
        await State.save();
        if(window.App) App.refreshAll();
      };
    });
  }

  function init(){
    renderBeamSpecs();
    renderPlankSpec();
  }

  function importSpecsFromExcel(beamSpecs, plankSpec){
    // اختياري
  }

  return {
    init, renderBeamSpecs, renderPlankSpec,
    addBeamSpec, resetBeamSpecs,
    importSpecsFromExcel
  };
})();