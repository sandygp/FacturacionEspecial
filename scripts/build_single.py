#!/usr/bin/env python3
"""Genera una versión de un solo archivo HTML (CSS y JS en línea) en dist/english-compass.html.

Uso: python3 scripts/build_single.py [--fragment]
  --fragment  omite <!doctype>, <html>, <head> y <body> (para publicarlo como Artifact).
"""
import pathlib, re, sys

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "css/styles.css").read_text(encoding="utf-8")
html = html.replace('<link rel="stylesheet" href="css/styles.css">', f"<style>\n{css}</style>")
for js in ("js/data.js", "js/app.js"):
    code = (root / js).read_text(encoding="utf-8")
    html = html.replace(f'<script src="{js}"></script>', f"<script>\n{code}</script>")

if "--fragment" in sys.argv:
    html = re.sub(r"<!doctype html>\s*<html[^>]*>\s*<head>\s*", "", html, flags=re.I)
    html = re.sub(r'<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*', "", html)
    html = re.sub(r"</head>\s*<body>\s*", "", html)
    html = re.sub(r"</body>\s*</html>\s*$", "", html)

out = root / "dist" / "english-compass.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf-8")
print(f"Escrito {out.relative_to(root)} ({len(html) // 1024} KB)")
