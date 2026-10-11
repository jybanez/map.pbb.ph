from pathlib import Path
import subprocess,json,hashlib
root=Path(__file__).resolve().parents[1]
revision='62426b58f67284a9ade2b9895d762499800ff393'
paths=('js/ui/ui.map.controls.js','js/ui/ui.loader.js','css/ui/ui.map.controls.css')
manifest_path=root/'vendor/manifest.json'
manifest=json.loads(manifest_path.read_text())
changes={}
for path in paths:
    data=subprocess.check_output(['git','-C','C:/wamp64/www/hotline-helpers','show',f'{revision}:{path}'])
    target=root/'vendor/helpers'/path
    changes[target.relative_to(root).as_posix()]={'previous':hashlib.sha256(target.read_bytes()).hexdigest(),'current':hashlib.sha256(data).hexdigest()}
    target.write_bytes(data)
    manifest['files'][target.relative_to(root).as_posix()]=hashlib.sha256(data).hexdigest()
manifest['helpersReviewedIncrement']={'commit':revision,'cacheRevision':'0.21.276','files':changes,'mode':'Exact committed source/CSS overlay on existing base snapshot; no working-tree or generated bundle copy'}
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(changes,indent=2))
