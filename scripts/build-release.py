"""Baut ausschließlich geprüfte Laufzeitdateien in ein reproduzierbares Shopware-ZIP."""
import hashlib, json, stat, subprocess, sys, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(ROOT / 'scripts/build-assets.py'), '--check'], check=True)
manifest = json.loads((ROOT / 'composer.json').read_text())
name = manifest['extra']['shopware-plugin-class'].split('\\')[-1]
version = manifest['version']
if len(sys.argv) > 1 and sys.argv[1].removeprefix('v') != version:
    raise SystemExit('Tag und Plugin-Version stimmen nicht überein.')
paths = [ROOT / 'composer.json', ROOT / 'README.md', * (ROOT / 'src').rglob('*')]
paths += [p for p in [ROOT / 'LICENSE', ROOT / 'LICENSE.md'] if p.exists()]
output = ROOT / 'dist'; output.mkdir(exist_ok=True)
archive = output / (name + '.zip')
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as target:
    for path in sorted(paths):
        if path.is_symlink(): raise SystemExit('Symlinks sind im Paket nicht erlaubt.')
        if not path.is_file() or path.name == ".gitkeep": continue
        relative = path.relative_to(ROOT)
        if any(part.startswith('.') or part in ['node_modules', 'vendor'] for part in relative.parts):
            raise SystemExit('Unerlaubte Datei im Paket: ' + str(relative))
        info = zipfile.ZipInfo(name + '/' + relative.as_posix(), date_time=(2020, 1, 1, 0, 0, 0))
        info.external_attr = (stat.S_IFREG | 0o644) << 16
        info.compress_type = zipfile.ZIP_DEFLATED
        target.writestr(info, path.read_bytes())
(archive.with_suffix('.zip.sha256')).write_text(hashlib.sha256(archive.read_bytes()).hexdigest() + '  ' + archive.name + '\n')
print(archive)
