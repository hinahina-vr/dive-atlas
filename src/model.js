export const SCHEMA=1;
const optional=(v,min,max,label)=>{if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw new Error(`${label}を確認してください。`);return n;};
const text=(v,max)=>String(v??'').trim().slice(0,max);
export function normalizeLog(raw){
 if(!raw||typeof raw!=='object')throw new Error('ログの形式を確認してください。');
 const date=text(raw.date,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw new Error('日付を確認してください。');
 const site=text(raw.site,100);if(!site)throw new Error('ポイント名を入力してください。');
 const lat=optional(raw.lat,-85,85,'緯度'),lon=optional(raw.lon,-180,180,'経度');if((lat===null)!==(lon===null))throw new Error('緯度と経度は両方入力してください。');
 const tusa=raw.tusa??null;if(tusa!==null&&(typeof tusa!=='object'||Array.isArray(tusa)||JSON.stringify(tusa).length>1000000))throw new Error('TUSAの追加データ形式を確認してください。');const signature=raw.signature??'';if(signature&&(typeof signature!=='string'||signature.length>3e6||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(signature)))throw new Error('サインの形式を確認してください。');const photos=raw.photos??[];if(!Array.isArray(photos)||photos.length>6||photos.some(p=>typeof p!=='string'||p.length>3e6||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p)))throw new Error('写真の形式・枚数を確認してください。');
 return {id:text(raw.id,100)||crypto.randomUUID(),date,site,area:text(raw.area,100),number:optional(raw.number,1,1e7,'ログ番号'),lat,lon,depth:optional(raw.depth,0,500,'最大水深'),duration:optional(raw.duration,0,1440,'潜水時間'),temperature:optional(raw.temperature,-5,50,'水温'),visibility:optional(raw.visibility,0,200,'透明度'),buddy:text(raw.buddy,100),creatures:text(raw.creatures,300),notes:text(raw.notes,5000),photos,source:text(raw.source,200),tusa,signature,locationKind:raw.locationKind==='approximate'?'approximate':'specified',locationLabel:text(raw.locationLabel,200),locationSource:text(raw.locationSource,500)};
}
export const sortLogs=logs=>[...logs].sort((a,b)=>b.date.localeCompare(a.date)||(b.tusa?.original?.START_TIME??0)-(a.tusa?.original?.START_TIME??0)||(b.number??0)-(a.number??0));
export function summary(logs){return {dives:logs.length,places:new Set(logs.filter(l=>l.lat!==null).map(l=>`${l.lat.toFixed(3)},${l.lon.toFixed(3)}`)).size,minutes:logs.reduce((n,l)=>n+(l.duration??0),0)};}
export function backup(logs){return {application:'dive-atlas',schema:SCHEMA,exportedAt:new Date().toISOString(),logs:sortLogs(logs)};}
export function readBackup(value){if(value?.application!=='dive-atlas'||value.schema!==SCHEMA||!Array.isArray(value.logs)||value.logs.length>10000)throw new Error('DIVE ATLASのバックアップ形式を確認してください。');return value.logs.map(normalizeLog);}
export function publicJournal(logs) {
 return sortLogs(logs).map(({date,site,depth,duration})=>({date,site,depth,duration}));
}
export function readPublicJournal(records) {
 const fields=['date','site','depth','duration'];
 if(!Array.isArray(records)||records.length>10000) throw new Error('公開ログの形式を確認してください。');
 return records.map((record,index)=>{
  if(!record||typeof record!=='object'||Object.keys(record).length!==fields.length||!fields.every(field=>Object.hasOwn(record,field))){
   throw new Error('公開ログは日付・ポイント名・水深・潜水時間の4項目です。');
  }
  return normalizeLog({...record,id:'public-'+(index+1)});
 });
}
export function mergeLogs(existing,incoming){const seen=new Set(existing.map(l=>l.id));const added=[];for(const log of incoming){if(!seen.has(log.id)){seen.add(log.id);added.push(log);}}return [...existing,...added];}
export function parseCSV(text){text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],field='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field='';}else field+=c;}if(quoted)throw new Error('CSVの引用符が閉じられていません。');row.push(field);if(row.some(v=>v.trim()))rows.push(row);if(rows.length<2)throw new Error('表形式のCSVを確認できませんでした。実ファイルの形式確認が必要です。');if(rows.length>10001)throw new Error('1回に取り込めるのは10,000件までです。');return rows;}
export const CSV_FIELDS=[['date','日付'],['site','ポイント名'],['area','エリア'],['number','ログ番号'],['lat','緯度'],['lon','経度'],['depth','最大水深（m）'],['duration','潜水時間（分）'],['temperature','水温（°C）'],['visibility','透明度（m）'],['buddy','バディ'],['creatures','生きもの'],['notes','メモ']];
export function guessMapping(headers){const aliases={date:['date','日付','潜水日','divedate'],site:['site','ポイント','ポイント名','ダイビングポイント','location','divingspot'],area:['area','エリア','地域'],number:['number','ログ番号','潜水番号','divenumber'],lat:['lat','latitude','緯度'],lon:['lon','longitude','経度','lng'],depth:['depth','最大水深','最大深度','maxdepth'],duration:['duration','潜水時間','divetime'],temperature:['temperature','水温','最低水温'],visibility:['visibility','透明度'],buddy:['buddy','バディ','バディ名'],notes:['notes','note','memo','メモ'],creatures:['creatures','生きもの']};const clean=s=>s.toLowerCase().replace(/[\s_（）()・]/g,'');return Object.fromEntries(CSV_FIELDS.map(([k])=>[k,headers.findIndex(h=>aliases[k].some(a=>clean(h)===clean(a)))]));}
export function csvToLogs(rows,mapping,source='CSV'){if(mapping.date<0||mapping.site<0)throw new Error('日付とポイント名の列を選んでください。');const fingerprint=r=>{let h=2166136261;for(const c of JSON.stringify(r)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0).toString(16);};const logs=[],errors=[];for(let i=1;i<rows.length;i++){const raw=Object.fromEntries(CSV_FIELDS.map(([k])=>[k,mapping[k]>=0?rows[i][mapping[k]]??'':'']));raw.date=raw.date.trim().replace(/\//g,'-').replace(/^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:[ T].*)?$/,(_,y,m,d)=>`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);raw.id='csv-'+fingerprint(raw);raw.source=source;try{logs.push(normalizeLog(raw));}catch(e){errors.push(`${i+1}行目：${e.message}`);}}return {logs,errors};}
