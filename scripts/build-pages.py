"""Package the public site at / and keep the former project URLs working."""
from pathlib import Path
import shutil
import sys

root = Path(__file__).resolve().parents[1]
output = Path(sys.argv[1] if len(sys.argv) > 1 else "_site")
output.mkdir(parents=True, exist_ok=False)
pages = ["index.html", "phone-assistant.html", "room-redesign.html", "lando-collection.html", "vinyl-wall.html", "v2.html", "v2-phone-assistant.html", "v2-room-redesign.html"]
files = pages + ["app.js", "guestbook.js", "collection.js", "content.js", "collection-cards.json", "vinyl-content.js", "vinyl.js", "styles.css", "v2.css", "v2.js", ".nojekyll", "CNAME"]
for name in files:
    shutil.copy2(root / name, output / name)
shutil.copytree(root / "assets", output / "assets")

legacy = output / "yue-portfolio"
legacy.mkdir()
for name in files:
    if name not in pages and name != "CNAME":
        shutil.copy2(root / name, legacy / name)
shutil.copytree(root / "assets", legacy / "assets")
for page in pages:
    target = "/" if page == "index.html" else "/" + page
    (legacy / page).write_text(f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>樾 · 个人页</title><link rel="canonical" href="https://blog.ultra-x.top{target}">
<meta http-equiv="refresh" content="0;url={target}">
<script>location.replace({target!r} + location.search + location.hash);</script>
</head><body><a href="{target}">打开个人页</a></body></html>''', encoding="utf-8")
print(f"Packaged {len(pages)} pages at the domain root, with legacy pages and assets preserved.")
