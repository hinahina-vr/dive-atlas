export function loadLogs() {
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('dive-atlas');
  request.onupgradeneeded=()=>request.transaction.abort();
  request.onerror=()=>{
   if(request.error?.name==='AbortError') resolve(null);
   else reject(request.error);
  };
  request.onblocked=()=>reject(new Error('別のタブを閉じてから開き直してください。'));
  request.onsuccess=()=>{
   const db=request.result;
   if(!db.objectStoreNames.contains('logs')){db.close();resolve(null);return;}
   const tx=db.transaction('logs','readonly');
   const logs=tx.objectStore('logs').getAll();
   tx.oncomplete=()=>{db.close();resolve(logs.result);};
   tx.onabort=()=>{db.close();reject(tx.error);};
  };
 });
}
