"""Filter a GeoNames JP.zip snapshot to Okinawa island names (CC BY 4.0)."""
from pathlib import Path
import argparse,json,re,unicodedata,zipfile

def name_key(value):
 value=unicodedata.normalize('NFKD',value).lower();value=''.join(c for c in value if not '\u0300'<=c<='\u036f');value=re.sub(r"[\s\-_.’']+",'',value);return re.sub(r'(islands?|shima|jima|諸島|島)$','',value)

def build(source):
 features=[]
 with zipfile.ZipFile(source) as archive:
  for line in archive.read('JP.txt').decode('utf-8').splitlines():
   row=line.split('\t')
   if row[6]!='T' or row[7] not in ('ISL','ISLS','ISLT'):continue
   lat,lon=float(row[4]),float(row[5])
   if not(25.7<=lat<=27.3 and 126.7<=lon<=128.6):continue
   alternatives=row[3].split(',');japanese=[n for n in alternatives if '島' in n and re.search(r'[\u3040-\u30ff\u4e00-\u9fff]',n) and not re.search(r'[\uac00-\ud7af]',n)]
   name=next((n for n in japanese if '岛' not in n),japanese[0] if japanese else row[1]);keys='|'.join(sorted({name_key(n) for n in [row[1],row[2],*alternatives] if len(name_key(n))>1}))
   features.append({'type':'Feature','id':int(row[0]),'geometry':{'type':'Point','coordinates':[lon,lat]},'properties':{'name':name,'name:ja':name,'class':'island','geonamesId':int(row[0]),'aliasKeys':keys}})
 return {'type':'FeatureCollection','features':features}
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('source',type=Path);parser.add_argument('--output',type=Path,default=Path('assets/okinawa-island-names.geojson'));args=parser.parse_args();args.output.write_text(json.dumps(build(args.source),ensure_ascii=False,separators=(',',':')),encoding='utf-8')
