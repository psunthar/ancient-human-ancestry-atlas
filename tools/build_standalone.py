#!/usr/bin/env python3
"""Build atlas-standalone.html: the whole atlas in one file that opens by double-click (file://).

Browsers block ES-module imports and fetch() from file://, so this script
  1. inlines css/style.css,
  2. concatenates the ES modules (dependencies first) into one inline module script, dropping
     the import lines and the `export` keywords,
  3. embeds each data file the app fetches (found from the load*('data/...') calls) and installs
     a small fetch() shim that answers those URLs from the embedded copies.
Only the Python standard library is needed. Run from anywhere:  python3 tools/build_standalone.py
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMPORT = re.compile(r"^import\s+.*?from\s+'(\./[^']+)';\s*$", re.M)


def order_modules(entry, seen=None, out=None):
    """Modules in dependency order (each before the modules that import it)."""
    seen = set() if seen is None else seen
    out = [] if out is None else out
    path = (ROOT / 'js' / entry).resolve()
    if path in seen:
        return out
    seen.add(path)
    for dep in IMPORT.findall(path.read_text(encoding='utf-8')):
        order_modules(dep, seen, out)
    out.append(path)
    return out


def strip_module(src):
    src = IMPORT.sub('', src)
    src = re.sub(r'^export\s+', '', src, flags=re.M)
    return src


def js_string(text):
    return json.dumps(text, ensure_ascii=False).replace('</', '<\\/')   # keep </script> out of the page


def main():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    css = (ROOT / 'css' / 'style.css').read_text(encoding='utf-8')
    mods = order_modules('app.js')
    code = '\n'.join('/* ---- %s ---- */\n%s' % (m.relative_to(ROOT), strip_module(m.read_text(encoding='utf-8'))) for m in mods)
    leftover = [l for l in code.split('\n') if re.match(r'^(import|export)\s', l)]
    if leftover:
        sys.exit('import/export left in bundle: %s' % leftover[:3])

    app = (ROOT / 'js' / 'app.js').read_text(encoding='utf-8')
    urls = sorted(set(re.findall(r"load\w+\('(data/[^']+)'", app)))
    if not urls:
        sys.exit('no data URLs found in js/app.js')
    data = {u: (ROOT / u).read_text(encoding='utf-8') for u in urls}
    shim = ('/* data files embedded by tools/build_standalone.py; fetch() is answered from them */\n'
            'const __EMBEDDED = {%s};\n'
            'const __realFetch = window.fetch ? window.fetch.bind(window) : null;\n'
            'window.fetch = function (u, o) {\n'
            '  const k = String(u);\n'
            '  if (Object.prototype.hasOwnProperty.call(__EMBEDDED, k)) { return Promise.resolve(new Response(__EMBEDDED[k])); }\n'
            '  return __realFetch ? __realFetch(u, o) : Promise.reject(new Error("fetch unavailable: " + k));\n'
            '};\n') % ',\n'.join('%s: %s' % (json.dumps(u), js_string(t)) for u, t in data.items())

    html = re.sub(r'<!--FILE-WARNING-->.*?<!--/FILE-WARNING-->\n?', '', html, flags=re.S)   # the standalone file runs from disk
    link = '<link rel="stylesheet" href="css/style.css">'
    script = '<script type="module" src="js/app.js"></script>'
    if link not in html or script not in html:
        sys.exit('index.html no longer contains the expected stylesheet or script tag')
    html = html.replace(link, '<style>\n%s</style>' % css)
    html = html.replace(script, '<script type="module">\n%s\n%s</script>' % (shim, code))
    note = '<!-- GENERATED FILE: edit the sources and run tools/build_standalone.py. Standalone copy of index.html; opens from disk. -->\n'
    html = html.replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n' + note, 1)
    out = ROOT / 'atlas-standalone.html'
    out.write_text(html, encoding='utf-8')
    print('wrote %s (%.0f KB; modules: %s; data: %s)' % (out.name, out.stat().st_size / 1024,
          ', '.join(m.name for m in mods), ', '.join(urls)))


if __name__ == '__main__':
    main()
