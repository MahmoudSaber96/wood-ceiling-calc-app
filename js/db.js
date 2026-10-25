/* ═══════════════════════════════════════════════
   DB — IndexedDB Wrapper
   قاعدة بيانات محلية آمنة (لا تُمسح بمسح الكوكيز)
   ═══════════════════════════════════════════════ */
window.DB = (function(){
  const DB_NAME = 'wood_ceiling_v3';
  const DB_VERSION = 1;
  const STORE = 'kv';
  let dbPromise = null;

  function open(){
    if(dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if(!window.indexedDB){
        reject(new Error('IndexedDB not supported'));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if(!db.objectStoreNames.contains(STORE)){
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = e => resolve(e.target.result);
      req.onerror = e => reject(e.target.error);
    });
    return dbPromise;
  }

  async function set(key, value){
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const st = tx.objectStore(STORE);
      const req = st.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = e => reject(e.target.error);
    });
  }

  async function get(key){
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const st = tx.objectStore(STORE);
      const req = st.get(key);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror = e => reject(e.target.error);
    });
  }

  async function del(key){
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const st = tx.objectStore(STORE);
      const req = st.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = e => reject(e.target.error);
    });
  }

  // تخزين كامل للحالة تحت مفتاح واحد
  async function saveState(stateObj){
    return set('app_state', stateObj);
  }
  async function loadState(){
    return get('app_state');
  }
  async function clearAll(){
    return del('app_state');
  }

  return { set, get, del, saveState, loadState, clearAll };
})();