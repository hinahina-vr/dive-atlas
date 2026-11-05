let dbPromise;
function open(){return dbPromise??=new Promise((resolve,reject)=>{const r=indexedDB.open('dive-atlas',1);r.onupgradeneeded=()=>r.result.createObjectStore('logs',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('別のタブを閉じてから開き直してください。'));});}
async function transaction(mode,run){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('logs',mode),result=run(tx.objectStore('logs'));tx.oncomplete=()=>resolve(result?.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('保存を完了できませんでした。'));});}
export const loadLogs=()=>transaction('readonly',s=>s.getAll());
export const saveLog=log=>transaction('readwrite',s=>s.put(log));
export const deleteLog=id=>transaction('readwrite',s=>s.delete(id));
export const saveBatch=logs=>transaction('readwrite',s=>{for(const l of logs)s.put(l);});
