from pathlib import Path
import subprocess,json,hashlib
root=Path(__file__).resolve().parents[1]
revision='4889e7f52724e095c0be806482c42f843ccd838a'
paths=('dist/helpers.ui.bundle.min.js','dist/helpers.ui.bundle.min.css','js/ui/ui.loader.js')
manifest_path=root/'vendor/manifest.json'
manifest=json.loads(manifest_path.read_text())
changes={}
for path in paths:
    data=subprocess.check_output(['git','-C','C:/wamp64/www/hotline-helpers','show',f'{revision}:{path}'])
    target=root/'vendor/helpers'/path;target.parent.mkdir(parents=True,exist_ok=True)
    changes[target.relative_to(root).as_posix()]={'previous':hashlib.sha256(target.read_bytes()).hexdigest() if target.exists() else None,'current':hashlib.sha256(data).hexdigest()}
    target.write_bytes(data);manifest['files'][target.relative_to(root).as_posix()]=hashlib.sha256(data).hexdigest()
manifest['helpersMode']='Bundle-preferred canonical uiLoader with exact committed local production UI JS/CSS; bundled event bag export'
manifest['helpersProductionBundle']={'commit':revision,'cacheRevision':'0.21.281','files':changes,'reviewMessage':8956}
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(changes,indent=2))
