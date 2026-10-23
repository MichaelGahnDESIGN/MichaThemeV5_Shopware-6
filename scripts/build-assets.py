"""Erzeugt fertige Styles und prüft den ausgelieferten Dateistand."""
import argparse, hashlib, json, shutil, subprocess, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'src/Resources/public'
STAMP = PUBLIC / 'build-integrity.json'
STYLE = ROOT / 'src/Resources/app/storefront/src/scss/base.scss'

def hashes(paths, base):
    return {p.relative_to(base).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(paths) if p.is_file()}
def sources():
    return hashes([ROOT / 'scripts/build-assets.py', * (ROOT / 'scripts/assets').glob('*.json'), * (ROOT / 'src/Resources/app').rglob('*')], ROOT)
def outputs():
    return hashes([p for p in PUBLIC.rglob('*') if p != STAMP], PUBLIC)
def check():
    recorded = json.loads(STAMP.read_text())
    if recorded != {'sources': sources(), 'outputs': outputs()} or not recorded['outputs']:
        raise SystemExit('Assets fehlen oder sind veraltet. Build vor dem Verpacken ausführen.')
    print('Fertige Assets und Quellstand geprüft.')
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
if not args.check:
    if (ROOT / 'scripts/assets/package-lock.json').exists():
        with tempfile.TemporaryDirectory(prefix='mgd-sass-') as directory:
            deps = Path(directory)
            for name in ['package.json', 'package-lock.json']:
                shutil.copy2(ROOT / 'scripts/assets' / name, deps / name)
            subprocess.run(['npm', 'ci', '--ignore-scripts', '--no-audit', '--no-fund'], cwd=deps, check=True)
            target = PUBLIC / 'storefront/plugin.css'
            target.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run([str(deps / 'node_modules/.bin/sass'), '--no-source-map', '--style=compressed', str(STYLE), str(target)], check=True)
    STAMP.write_text(json.dumps({'sources': sources(), 'outputs': outputs()}, indent=2) + '\n')
check()
