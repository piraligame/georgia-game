from pathlib import Path
import shutil
import subprocess,sys
root=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(root/"scripts"/"build_game.py")],check=True)
out=root/"www"
out.mkdir(exist_ok=True)
for filename in ("index.html","style.css","main.js","audio.js","i18n.js","privacy.html","favicon.svg"):
    shutil.copy2(root/filename,out/filename)
shutil.copytree(root/"assets",out/"assets",dirs_exist_ok=True)
(out/"vendor").mkdir(exist_ok=True)
vendor=root/"node_modules"/"three"/"build"/"three.module.js"
if not vendor.exists():
    raise SystemExit("three dependency missing: run npm install")
shutil.copy2(vendor,out/"vendor"/"three.module.js")
js=out/"main.js"
source=js.read_text(encoding="utf-8")
old="https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js"
if old not in source:
    raise SystemExit("three import missing in main.js")
js.write_text(source.replace(old,"./vendor/three.module.js",1),encoding="utf-8")
print("ANDROID_OFFLINE_WEB_BUNDLE_READY")
