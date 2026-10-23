"""Prüft das tatsächliche ZIP und die Abweisung veralteter Build-Dateien."""
import hashlib, json, re, shutil, subprocess, sys, tempfile, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'composer.json').read_text())
name = manifest['extra']['shopware-plugin-class'].split('\\')[-1]
archive = ROOT / 'dist' / (name + '.zip')
with zipfile.ZipFile(archive) as package:
    entries = package.namelist()
    assert all(e.startswith(name + '/') and '..' not in e.split('/') for e in entries)
    assert json.loads(package.read(name + '/composer.json'))['version'] == manifest['version']
    stamp = json.loads(package.read(name + '/src/Resources/public/build-integrity.json'))
    for path, digest in stamp['outputs'].items():
        assert hashlib.sha256(package.read(name + '/src/Resources/public/' + path)).hexdigest() == digest
    assert not any('/node_modules/' in e or '/.env' in e or e.endswith('.map') for e in entries)
    # Jede lokale Asset-Referenz muss im ZIP vorhanden sein.
    for entry in entries:
        if entry.endswith('.twig'):
            text = package.read(entry).decode()
            for path in re.findall(r"bundles/[^/]+/([^'\"]+)", text):
                if '{' not in path:
                    assert name + '/src/Resources/public/' + path in entries, path
with tempfile.TemporaryDirectory(prefix='mgd-stale-assets-') as directory:
    temp = Path(directory)
    for folder in ['scripts', 'src']:
        shutil.copytree(ROOT / folder, temp / folder)
    command = [sys.executable, str(temp / 'scripts/build-assets.py'), '--check']
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL)
    source = next((temp / 'src/Resources/app').rglob('*.scss'))
    original = source.read_bytes(); source.write_bytes(original + b'\n/* changed */')
    assert subprocess.run(command, capture_output=True).returncode != 0
    source.write_bytes(original)
    output = next(p for p in (temp / 'src/Resources/public').rglob('*.css'))
    output.write_bytes(output.read_bytes() + b'\n/* damaged */')
    assert subprocess.run(command, capture_output=True).returncode != 0
print('ZIP-Inhalt, Asset-Links, Prüfsummen und veraltete/manipulierte Builds geprüft.')
