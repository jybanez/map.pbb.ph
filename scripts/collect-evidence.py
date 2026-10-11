from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
for name in ('browser-verification', 'cold-start', 'emulated-touch', 'recovery', 'navbar', 'zoom', 'context', 'native-context', 'repeat-context', 'flight', 'search'):
    lines = (root / f'docs/evidence/{name}.txt').read_text(encoding='utf-8-sig').splitlines()
    result = next((json.loads(line) for line in lines if line.startswith('{')), None)
    if result is None:
        raise RuntimeError(f'No successful result in {name}')
    (root / f'docs/evidence/{name}.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(f'{name}: verified report saved')
