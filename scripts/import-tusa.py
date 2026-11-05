"""Read a TUSA Android backup ZIP without extracting untrusted paths."""
import argparse,base64,datetime,hashlib,io,json,math,re,sqlite3,sys,zipfile

def convert(data,locations=None):
 if len(data)>80*1024*1024: raise ValueError('ZIPは80MB以下にしてください。')
 locations=locations or {}
 with zipfile.ZipFile(io.BytesIO(data)) as archive:
  info=archive.infolist()
  if len(info)>5000 or sum(x.file_size for x in info)>256*1024*1024:raise ValueError('バックアップの容量が大きすぎます。')
  candidates=[x for x in info if x.filename.replace('\\','/').split('/')[-1]=='backup.db']
  if len(candidates)!=1:raise ValueError('TUSAのbackup.dbを1つ含むZIPを選んでください。')
  db=candidates[0];blob=archive.read(db)
  if not blob.startswith(b'SQLite format 3\0'):raise ValueError('バックアップのデータベース形式が異なります。')
  connection=sqlite3.connect(':memory:');connection.deserialize(blob);connection.execute('PRAGMA trusted_schema=OFF');connection.execute('PRAGMA query_only=ON');connection.row_factory=sqlite3.Row
  try: rows=[dict(row) for row in connection.execute('SELECT * FROM DIVING_LOG_TB ORDER BY DATE,START_TIME,_ID')]
  finally:connection.close()
  if len(rows)>10000:raise ValueError('1回に取り込めるログは10,000本までです。')
  names={i.filename.replace('\\','/'):i for i in info};prefix=db.filename.replace('\\','/').rsplit('/',1)[0]+'/' if '/' in db.filename else ''
  def image(name):
   if not name:return ''
   name=str(name).replace('\\','/');match=names.get(name) or names.get(prefix+name)
   if match is None:raise ValueError('参照されている画像がZIPにありません。')
   if match.file_size>2100000:raise ValueError('画像が大きすぎます。')
   body=archive.read(match)
   if body.startswith(b'\xff\xd8\xff'):mime='jpeg'
   elif body.startswith(b'\x89PNG\r\n\x1a\n'):mime='png'
   elif body.startswith(b'RIFF') and body[8:12]==b'WEBP':mime='webp'
   else:raise ValueError('画像の形式を確認できませんでした。')
   return 'data:image/'+mime+';base64,'+base64.b64encode(body).decode()
  def number(value):
   if value is None:return None
   n=float(value)
   return None if not math.isfinite(n) or n==-999 else n
  logs=[];jst=datetime.timezone(datetime.timedelta(hours=9))
  for row in rows:
   ms=number(row.get('DATE'))
   if ms is None:raise ValueError('日付がないログがあります。')
   date=datetime.datetime.fromtimestamp(ms/1000,jst).date().isoformat()
   lat=number(row.get('POINT_LATITUDE'));lon=number(row.get('POINT_LONGITUDE'))
   if lat is None or lon is None:lat=lon=None
   elif not (-85<=lat<=85 and -180<=lon<=180):raise ValueError('位置情報の範囲が不正です。')
   site=str(row.get('POINT') or '').strip() or 'ポイント未設定'
   place=locations.get(site);kind='specified';label=source=''
   if lat is None and place:
    lat=float(place['lat']);lon=float(place['lon']);kind='approximate';label=place['label'];source=place['source']
   filenames=str(row.get('PHOTO_FILE_NAME') or '').strip()
   photos=[]
   if filenames:
    files=json.loads(filenames) if filenames.startswith('[') else re.split(r'[,;|]',filenames)
    if len(files)>6:raise ValueError('写真が6枚を超えるログがあります。画像を分けて確認してください。')
    photos=[image(n.strip()) for n in files if n.strip()]
   logs.append({'id':'tusa-'+str(row['_ID'])+'-'+str(int(ms)),'date':date,'site':site,'area':str(row.get('LOCATION') or ''),'number':None,'lat':lat,'lon':lon,'depth':number(row.get('MAX_DEPTH')),'duration':number(row.get('BOTTOM_TIME_MINUTE')),'temperature':number(row.get('WATER_TEMP')),'visibility':number(row.get('TRANSPARENCY')),'buddy':str(row.get('BUDDY') or ''),'creatures':'','notes':str(row.get('MEMO') or ''),'photos':photos,'signature':image(row.get('INSTRUCTOR_SIGN_FILE_NAME')),'source':'TUSA ダイビングLog','locationKind':kind,'locationLabel':label,'locationSource':source,'tusa':{'original':row,'sourceArchiveSHA256':hashlib.sha256(data).hexdigest(),'dateTimezone':'Asia/Tokyo','databaseIdIsDiveNumber':False}})
 return {'application':'dive-atlas','schema':1,'logs':logs,'importSummary':{'dives':len(logs),'signatures':sum(bool(l['signature']) for l in logs),'photos':sum(len(l['photos']) for l in logs),'approximateLocations':sum(l['locationKind']=='approximate' for l in logs),'profiles':sum(bool(l['tusa']['original'].get('DEPTH_CSV_STR')) for l in logs)}}

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--input',default='-');parser.add_argument('--output');parser.add_argument('--locations');args=parser.parse_args()
 try:
  from pathlib import Path
  data=sys.stdin.buffer.read(80*1024*1024+1) if args.input=='-' else Path(args.input).read_bytes()
  locations=json.loads(Path(args.locations).read_text(encoding='utf-8')) if args.locations else None
  result=json.dumps(convert(data,locations),ensure_ascii=False,separators=(',',':'))
  if args.output:Path(args.output).write_text(result,encoding='utf-8')
  else:sys.stdout.buffer.write(result.encode('utf-8'))
 except Exception as e:
  sys.stderr.buffer.write(('TUSAバックアップを読み込めません：'+str(e)).encode('utf-8'));sys.exit(1)
