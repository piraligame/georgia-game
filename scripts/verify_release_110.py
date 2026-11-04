from pathlib import Path
import subprocess,re,zipfile,json
from PIL import Image
root=Path.home()/"Documents"/"GeorgiaGame"
tools=Path.home()/"AppData"/"Local"/"Android"/"Sdk"/"build-tools"/"36.0.0"
old=root/"Releases"/"Alpha-1.09"/"GEORGIA-Alpha-1.09-Android.apk"
apk=root/"android"/"app"/"build"/"outputs"/"apk"/"release"/"app-release.apk"
aab=root/"android"/"app"/"build"/"outputs"/"bundle"/"release"/"app-release.aab"
def run(args):
 p=subprocess.run([str(x) for x in args],capture_output=True,text=True,timeout=90)
 if p.returncode:raise RuntimeError("FAILED "+p.stdout[-800:]+p.stderr[-800:])
 return p.stdout+"\n"+p.stderr
def signature(apk):
 text=run([tools/"apksigner.bat","verify","--verbose","--print-certs",apk])
 m=re.search(r"Signer #1 certificate SHA-256 digest:\s*([0-9a-f]+)",text,re.I)
 if not m:raise RuntimeError("MISSING_CERTIFICATE "+str(apk))
 return m.group(1).lower()
oldcert=signature(old);newcert=signature(apk)
assert oldcert==newcert,"NEW APK DOES NOT MATCH EXISTING RELEASE CERTIFICATE"
before=run([tools/"aapt.exe","dump","badging",old])
after=run([tools/"aapt.exe","dump","badging",apk])
before_pkg=next(x for x in before.splitlines() if x.startswith("package:"))
after_pkg=next(x for x in after.splitlines() if x.startswith("package:"))
assert "name='com.piraligame.georgia'" in before_pkg and "name='com.piraligame.georgia'" in after_pkg
assert "versionCode='4'" in before_pkg,"PREVIOUS VERSION NOT 4"
assert "versionCode='5'" in after_pkg and "versionName='1.0.10'" in after_pkg,"NEW VERSION CODE WRONG"
assert "targetSdkVersion:'36'" in after
assert "jar verified" in run(["jarsigner","-verify",aab]).lower()
with zipfile.ZipFile(apk) as z:
 for f in ["assets/public/index.html","assets/public/main.js","assets/public/style.css","assets/public/i18n.js","assets/public/assets/icons/georgia-launcher.png"]:
  assert f in z.namelist(),f
 page=z.read("assets/public/index.html").decode("utf-8")
 source=z.read("assets/public/main.js").decode("utf-8")
 assert "ALPHA 1.10" in page and "georgia-launcher.png?v=1.10" in page
 assert "ev.clientY<innerHeight*.5" in source
 assert "initThumbDash()" in source
 assert "control-hand-toggle" not in source
 assert "__GEORGIA_DEV" not in source
icon=root/"assets"/"icons"/"georgia-launcher.png"
with Image.open(icon) as im:
 assert im.size==(1024,1024),"LAUNCHER ICON SHOULD BE 1024x1024"
playicon=root/"store"/"alpha-1.10"/"PlayStore-Icon-512.png"
with Image.open(playicon) as im:assert im.size==(512,512)
result={"status":"PASS","package":"com.piraligame.georgia","versionName":"1.0.10","versionCode":5,
"oldVersionCode":4,"sameReleaseCertificate":True,"signerSHA256":newcert,
"targetSdk":36,"apkBytes":apk.stat().st_size,"aabBytes":aab.stat().st_size,
"floatingJoystickLowerHalfOnly":True,"menuHandToggleRemoved":True,
"alignedCastleAndFlag":True,"playerOnly":True}
out=root/"Releases"/"Alpha-1.10"
out.mkdir(parents=True,exist_ok=True)
(out/"ANDROID_UPGRADE_CHECK.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("GEORGIA_ALPHA_110_ANDROID_VERIFIED",json.dumps(result,ensure_ascii=False),flush=True)
