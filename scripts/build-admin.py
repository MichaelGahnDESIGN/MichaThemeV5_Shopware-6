"""Baut das Admin-JS (fertig, ohne Build beim Händler): src/Resources/public/administration/js/micha-theme-v5.js

Quelle: src/Resources/app/administration/src/module/michatheme-v5/index.js. Die Dateien sind einfache Skripte (jede in einer eigenen
Funktion), "import './x.js'" fügt die Datei ein, "import NAME from './x.json'" macht daraus eine Variable. Mehr kann das Skript nicht.
Aufruf:  python3 scripts/build-admin.py          schreibt die Datei
         python3 scripts/build-admin.py --check  prüft nur, ob sie zur Quelle passt (CI)
Alternative: der normale Shopware-Build (bin/build-administration.sh) versteht dieselben Quellen.
"""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENTRY = ROOT / 'src/Resources/app/administration/src/module/michatheme-v5/index.js'
OUT = ROOT / 'src/Resources/public/administration/js/micha-theme-v5.js'
CHANGELOG = ROOT / 'CHANGELOG.md'
CHANGELOG_COPY = ROOT / 'src/Resources/changelog.txt'  # fürs Admin (Info-Seite); im ZIP sind nur Dateien unter src erlaubt
ENTRYPOINTS = ROOT / 'src/Resources/public/administration/.vite/entrypoints.json'
JS_IMPORT = re.compile(r"^import\s+['\"]([^'\"]+\.js)['\"];\s*$")
JSON_IMPORT = re.compile(r"^import\s+([A-Za-z_]\w*)\s+from\s+['\"]([^'\"]+\.json)['\"];\s*$")


def collect(path, seen, parts):
    path = path.resolve()
    if path in seen:
        return
    seen.add(path)
    body = []
    for line in path.read_text(encoding='utf-8').splitlines():
        m = JS_IMPORT.match(line)
        j = JSON_IMPORT.match(line)
        if m:
            collect(path.parent / m.group(1), seen, parts)
        elif j:
            data = json.loads((path.parent / j.group(2)).read_text(encoding='utf-8'))
            parts.append('var %s = %s;\n' % (j.group(1), json.dumps(data, ensure_ascii=False)))
        elif line.startswith('import ') or line.startswith('export '):
            raise SystemExit('Nicht unterstützt in %s: %s' % (path.relative_to(ROOT), line))
        else:
            body.append(line)
    parts.append('/* ' + path.relative_to(ROOT).as_posix() + ' */\n' + '\n'.join(body).strip('\n') + '\n')


def build():
    parts = []
    collect(ENTRY, set(), parts)
    head = ('/* MichaThemeV5 Admin-Modul - AUTOMATISCH GEBAUT (python3 scripts/build-admin.py), nicht von Hand ändern.\n'
            ' * Quelle: src/Resources/app/administration/src/module/michatheme-v5. Kein Build beim Händler nötig. */\n')
    return head + "(function () {\n'use strict';\n" + '\n'.join(parts) + "})();\n"


ENTRYPOINTS_JSON = json.dumps({
    'base': '/bundles/michathemev5/administration/',
    'entryPoints': {'micha-theme-v5': {'css': [], 'dynamic': [], 'js': ['/bundles/michathemev5/administration/js/micha-theme-v5.js'], 'legacy': False, 'preload': []}},
    'legacy': False, 'metadatas': {}, 'version': ['7.1.0', 7, 1, 0], 'viteServer': None,
}, indent=2) + '\n'


def main():
    code = build()
    if '--check' in sys.argv:
        copy_ok = not CHANGELOG.exists() or (CHANGELOG_COPY.exists() and CHANGELOG_COPY.read_text(encoding='utf-8') == CHANGELOG.read_text(encoding='utf-8'))
        ok = copy_ok and OUT.exists() and OUT.read_text(encoding='utf-8') == code and ENTRYPOINTS.exists() and ENTRYPOINTS.read_text(encoding='utf-8') == ENTRYPOINTS_JSON
        if not ok:
            raise SystemExit('Admin-JS ist veraltet. Bitte python3 scripts/build-admin.py ausführen.')
        print('Admin-JS passt zur Quelle.')
        return
    OUT.parent.mkdir(parents=True, exist_ok=True)
    ENTRYPOINTS.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(code, encoding='utf-8')
    if CHANGELOG.exists():
        CHANGELOG_COPY.write_text(CHANGELOG.read_text(encoding='utf-8'), encoding='utf-8')
    ENTRYPOINTS.write_text(ENTRYPOINTS_JSON, encoding='utf-8')
    subprocess.run(['node', '--check', str(OUT)], check=True)
    print(OUT.relative_to(ROOT), len(code), 'Bytes')


main()
