/* ═══════════════════════════════════════════════
   STATE — الحالة العامة للتطبيق
   ═══════════════════════════════════════════════ */
window.State = (function(){

  const DEFAULTS = {
    setupDone: false,
    convoy: '',
    team: '',
    mgr1: { name: '', phone: '' },
    mgr2: { name: '', phone: '' },
    tools: '', // ← حقل العدة الجديد
    cases: [],
    beamSpecs: [
      { id: 1, height: 9,   width: 5,   price: 18500, fromLen: 0,   toLen: 599   },
      { id: 2, height: 12.5,width: 7,   price: 18500, fromLen: 600, toLen: 99999 }
    ],
    plankSpec: { width: 100, thickness: 19, price: 18500 },
    idSeq: 1,
    specIdSeq: 3
  };

  let state = JSON.parse(JSON.stringify(DEFAULTS));

  function get(){ return state; }
  function set(newState){ state = newState; }

  function resetToDefaults(){
    state = JSON.parse(JSON.stringify(DEFAULTS));
  }

  async function load(){
    try {
      const saved = await DB.loadState();
      if(saved && typeof saved === 'object'){
        state = Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), saved);
        const maxCaseId = Math.max(0, ...(state.cases||[]).map(c => c.id||0));
        const maxSpecId = Math.max(0, ...(state.beamSpecs||[]).map(s => s.id||0));
        state.idSeq = Math.max(state.idSeq||1, maxCaseId+1);
        state.specIdSeq = Math.max(state.specIdSeq||1, maxSpecId+1);
      }
    } catch(e){
      console.warn('DB load failed, using defaults', e);
    }
    return state;
  }

  async function save(){
    try {
      await DB.saveState(state);
    } catch(e){
      console.warn('DB save failed', e);
    }
  }

  // ─── الحالات ───
  function addCase(c){
    c.id = state.idSeq++;
    state.cases.push(c);
  }
  function deleteCase(id){
    state.cases = state.cases.filter(x => x.id !== id);
  }
  function clearCases(){
    state.cases = [];
  }
  function updateCase(idx, field, val){
    if(state.cases[idx]) state.cases[idx][field] = val;
  }

  // ─── مواصفات العروق ───
  function addBeamSpec(s){
    s.id = state.specIdSeq++;
    state.beamSpecs.push(s);
    return s;
  }
  function deleteBeamSpec(id){
    state.beamSpecs = state.beamSpecs.filter(s => s.id !== id);
  }
  function updateBeamSpec(id, field, val){
    const s = state.beamSpecs.find(x => x.id === id);
    if(s) s[field] = val;
  }

  // ─── إعدادات القافلة ───
  function saveSetup(data){
    state.convoy = data.convoy;
    state.team = data.team;
    state.mgr1 = data.mgr1;
    state.mgr2 = data.mgr2;
    if(data.tools !== undefined) state.tools = data.tools; // ← حفظ العدة
    state.setupDone = true;
  }

  return {
    get, set, load, save, resetToDefaults,
    addCase, deleteCase, clearCases, updateCase,
    addBeamSpec, deleteBeamSpec, updateBeamSpec,
    saveSetup
  };
})();