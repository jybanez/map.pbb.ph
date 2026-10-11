"""Pin Apache-2.0 naturalatlas port and NOAA WMM2025; no runtime network."""
from pathlib import Path
import urllib.request, json, re, hashlib, zipfile, io
root=Path(__file__).resolve().parents[1]
dest=root/'vendor/geomagnetism'
sha='5cf5cba40d8cadf4220734296bbfe4a7f4351be6'
base=f'https://raw.githubusercontent.com/naturalatlas/geomagnetism/{sha}/'
files=['LICENSE','package.json','data/wmm-2025.json','lib/model.js','lib/ellipsoid.js','lib/legendre.js','lib/magnetic_elements.js','lib/magnetic_vector.js','lib/coords/geodetic.js','lib/coords/spherical.js','lib/coords/cartesian.js']
hashes={}
for name in files:
    raw=urllib.request.urlopen(base+name,timeout=30).read()
    hashes[name]=hashlib.sha256(raw).hexdigest()
    text=raw.decode()
    if name.endswith('.js'):
        text=re.sub(r"var (\w+) = require\('([^']+)'\);",r"import \1 from '\2';",text)
        text=re.sub(r'module.exports = (\w+);',r'export default \1;',text)
        if name=='lib/model.js':
            text=text.replace('(1000*3600*24*365)','(Date.UTC(year_int+1,0,1)-Date.UTC(year_int,0,1))')
        if name=='lib/coords/geodetic.js':
            text=text.replace('options.lambda || options.lon','options.lambda ?? options.lon').replace('options.phi || options.lat','options.phi ?? options.lat')
        text='// PBB modification: ESM imports/exports; model UTC leap-year fraction and geodetic zero handling corrected.\n'+text
    if name=='package.json':
        package=json.loads(text);package['type']='module';text=json.dumps(package,indent=2)
    path=dest/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text,encoding='utf-8')
url='https://www.ncei.noaa.gov/sites/default/files/2024-12/WMM2025COF.zip'
raw=urllib.request.urlopen(url,timeout=30).read(); hashes['NOAA.zip']=hashlib.sha256(raw).hexdigest()
z=zipfile.ZipFile(io.BytesIO(raw));name=next(n for n in z.namelist() if n.endswith('/WMM.COF'))
cof=z.read(name);(dest/'WMM.COF').write_bytes(cof)
data=json.loads((dest/'data/wmm-2025.json').read_text())
for line in cof.decode().splitlines()[1:]:
    fields=line.split()
    if len(fields)!=6:continue
    n,m=int(fields[0]),int(fields[1]);i=n*(n+1)//2+m
    for key,value in zip(['main_field_coeff_g','main_field_coeff_h','secular_var_coeff_g','secular_var_coeff_h'],fields[2:]):
        assert data[key][i]==float(value),(key,i)
# Explicit official epoch validity, rather than upstream release-day bounds.
data['start_date']='2025-01-01T00:00:00.000Z';data['end_date']='2029-12-31T23:59:59.999Z'
(dest/'wmm2025.js').write_text('export default '+json.dumps(data)+';\n',encoding='utf-8')
testurl='https://www.ncei.noaa.gov/sites/default/files/2025-02/WMM2025_TEST_VALUES.txt'
testdata=urllib.request.urlopen(testurl,timeout=30).read();(dest/'WMM2025_TEST_VALUES.txt').write_bytes(testdata)
hashes['NOAA.tests']=hashlib.sha256(testdata).hexdigest()
(dest/'provenance.json').write_text(json.dumps({'commit':sha,'source':base,'coefficientArchive':url,'tests':testurl,'sourceSHA256':hashes,'runtimeSHA256':{str(p.relative_to(dest)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in dest.rglob('*') if p.is_file() and p.name!='provenance.json'}},indent=2),encoding='utf-8')
print('Pinned geomagnetism, all90 NOAA coefficient rows match; reference tests saved.')
