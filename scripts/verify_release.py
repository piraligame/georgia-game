"""GEORGIA Android release safety check: upgradable signature, package and assets."""
from pathlib import Path
import subprocess,re,zipfile,hashlib,json,sys
ROOT=Path(__file__).resolve().parent.parent
TOOLS=Path.home()/"AppData"/"Local"/"Android"/"Sdk"/"build-tools"/"36.0.0"
OLDER=ROOT/"Releases"/"Alpha-1.08"/"GEORGIA-Alpha-1.08-Android.apk"
APK=ROOT/"android"/"app"/"build"/"outputs"/"apk"/"release"/"app-release.apk"
AAB=ROOT/"android"/"app"/"build"/"outputs"/"bundle"/"release"/"app-release.aab"
def cmd(*args):
 p=subprocess.run([str(v) for v in args],capture_output=True,text=True,timeout=120)
 if p.returncode:raise RuntimeError("Failed: "+str(args[:2])+" "+(p.stdout+p.stderr)[-1000:])
 return p.stdout+"\n"+p.stderr
def match_sig(text):
 m=re.search(r"Signer #1 certificate SHA-256 digest:\s*([a-f0-9]+)",text,re.I)
 if not m:raise RuntimeError("Signer certificate missing")
 return m.group(1).lower()
oldpkg=cmd(TOOLS/"aapt.exe","dump","badging",OLDER)
newpkg=cmd(TOOLS/"aapt.exe","dump","badging",APK)
oldline=next(l for l in oldpkg.splitlines() if l.startswith("package:"))
newline=next(l for l in newpkg.splitlines() if l.startswith("package:"))
assert "name='com.piraligame.georgia'" in oldline and "name='com.piraligame.georgia'" in newline
assert "versionCode='3'" in oldline and "versionCode='4'" in newline
assert "versionName='1.0.9'" in newline
assert "targetSdkVersion:'36'" in newpkg
oldcert=match_sig(cmd(TOOLS/"apksigner.bat","verify","--print-certs",OLDER))
newcert=match_sig(cmd(TOOLS/"apksigner.bat","verify","--verbose","--print-certs",APK))
assert oldcert==newcert,"SIGNER MISMATCH: DO NOT PUBLISH"
assert "jar verified" in cmd("jarsigner","-verify",AAB).lower()
with zipfile.ZipFile(APK) as arc:
 names=set(arc.namelist())
 needed={"assets/public/index.html","assets/public/main.js","assets/public/style.css",
         "assets/public/i18n.js","assets/public/privacy.html","assets/public/audio.js",
         "assets/public/vendor/three.module.js"}
 assert needed.issubset(names),needed-names
 index=arc.read("assets/public/index.html").decode("utf-8")
 bundle=arc.read("assets/public/main.js").decode("utf-8")
 css=arc.read("assets/public/style.css").decode("utf-8")
 policy=arc.read("assets/public/privacy.html").decode("utf-8")
 assert "ALPHA 1.09" in index
 assert "PIRALI Game presents GEORGIA" in index
 assert "piraligameofficial@gmail.com" in index and "piraligameofficial@gmail.com" in policy
 assert "PIRALI Game studio visual language" in css
 assert "consistentEnemySilhouettes" in bundle
 assert "switchControlHand" in bundle and "joystickCenter" in bundle
 assert "farBody" not in bundle and "addFarEnemy" not in bundle
 assert "devPanel" not in bundle and "__GEORGIA_DEV" not in bundle
 assert "./vendor/three.module.js" in bundle
 report={
 "result":"PASS",
 "previous_version":"1.0.8",
 "current_version":"1.0.9",
 "versionCode":4,"package":"com.piraligame.georgia",
 "targetSdk":36,
 "same_release_signing_key":oldcert==newcert,
 "certificate_sha256":newcert,
 "apk_size":APK.stat().st_size,
 "aab_size":AAB.stat().st_size,
 "player_excludes_developer_tools":True,
 "complete_3D_enemy_models":True,
 "left_right_hand_control":True,
 "pirali_game_contact":True}
print(json.dumps(report,ensure_ascii=False,indent=2),flush=True)
out=ROOT/"Releases"/"Alpha-1.09";out.mkdir(parents=True,exist_ok=True)
(out/"ANDROID_UPGRADE_CHECK.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
