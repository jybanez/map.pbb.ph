"""Pin public reference assets only; never copy credentials or project configuration."""
from pathlib import Path
import hashlib, json, shutil, subprocess

ROOT = Path(__file__).resolve().parents[1]
HELPERS = Path('C:/wamp64/www/hotline-helpers')
HOTLINE = Path('C:/wamp64/www/pbb/hotline')
destination = ROOT / 'vendor/helpers'
for folder in ('js/ui', 'css/ui', 'licenses'):
    shutil.copytree(HELPERS / folder, destination / folder, dirs_exist_ok=True)
for name in ('README.md', 'package.json'):
    shutil.copy2(HELPERS / name, destination / name)
renderer = ROOT / 'vendor/maplibre/4.6.0'
renderer.mkdir(parents=True, exist_ok=True)
for name in ('maplibre-gl.js', 'maplibre-gl.css'):
    shutil.copy2(HOTLINE / 'public/vendor/maplibre' / name, renderer / name)
style = ROOT / 'assets/maps/hotline-dark.json'
style.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(HOTLINE / 'public/maps/operator-vector-style.json', style)
files = [p for p in (ROOT / 'vendor').rglob('*') if p.is_file() and p != ROOT / 'vendor/manifest.json']
manifest = {
    'snapshotDate': '2026-10-10',
    'helpersCommit': subprocess.check_output(['git', '-C', str(HELPERS), 'rev-parse', 'HEAD'], text=True).strip(),
    'helpersMode': 'source-only through canonical uiLoader; no mixed prebuilt bundle',
    'maplibreVersion': '4.6.0',
    'files': {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)},
}
(ROOT / 'vendor/manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(f'Pinned {len(files)} public runtime files.')
