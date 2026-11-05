import base64,importlib.util,io,json,sqlite3,unittest,zipfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('tusa_import',Path(__file__).with_name('import-tusa.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class TusaImportTest(unittest.TestCase):
 def fixture(self):
  c=sqlite3.connect(':memory:');c.execute('CREATE TABLE DIVING_LOG_TB (_ID INTEGER,DATE REAL,START_TIME REAL,LOCATION TEXT,POINT TEXT,POINT_LATITUDE REAL,POINT_LONGITUDE REAL,MAX_DEPTH REAL,BOTTOM_TIME_MINUTE INTEGER,WATER_TEMP REAL,TRANSPARENCY REAL,AVE_DEPTH REAL,PHOTO_FILE_NAME TEXT,INSTRUCTOR_SIGN_FILE_NAME TEXT,MEMO TEXT)')
  c.execute('INSERT INTO DIVING_LOG_TB VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(7,1793458800000,12000000,'エリア','テストの海',-999,-999,17.8,32,27,30,10.3,'','7/s_7.jpg','元メモ'))
  out=io.BytesIO()
  with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:z.writestr('backup.db',c.serialize());z.writestr('7/s_7.jpg',b'\xff\xd8\xfffixture')
  c.close();return out.getvalue()
 def test_missing_gps_and_internal_id(self):
  log=module.convert(self.fixture())['logs'][0];self.assertEqual(log['date'],'2026-11-01');self.assertIsNone(log['lat']);self.assertIsNone(log['lon']);self.assertIsNone(log['number']);self.assertEqual(log['depth'],17.8);self.assertEqual(log['temperature'],27);self.assertEqual(log['tusa']['original']['POINT_LATITUDE'],-999);self.assertTrue(log['signature'].startswith('data:image/jpeg;base64,'))
 def test_approved_approximate_location_preserves_original(self):
  log=module.convert(self.fixture(),{'テストの海':{'lat':26.2,'lon':127.4,'label':'代表位置','source':'https://example.test'}})['logs'][0];self.assertEqual(log['locationKind'],'approximate');self.assertEqual(log['lat'],26.2);self.assertEqual(log['tusa']['original']['POINT_LATITUDE'],-999)
 def test_reject_unrelated_zip(self):
  out=io.BytesIO()
  with zipfile.ZipFile(out,'w') as z:z.writestr('unrelated.txt','not a TUSA backup')
  with self.assertRaises(ValueError):module.convert(out.getvalue())
if __name__=='__main__':unittest.main()
