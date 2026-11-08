from pathlib import Path
import re,subprocess,zipfile,hashlib,json,shutil
root=Path(__file__).resolve().parent.parent
sdk=Path.home()/"AppData/Local/Android/Sdk/build-tools/36.0.0"
old=root/"Releases/Alpha-1.10/GEORGIA-Alpha-1.10-Android.apk"
apk=root/"android/app/build/outputs/apk/release/app-release.apk"
aab=root/"android/app/build/outputs/bundle/release/app-release.aab"
def run(*cmd):
    p=subprocess.run([str(x) for x in cmd],capture_output=True,text=True,timeout=120)
    if p.returncode:raise RuntimeError("FAILED "+str(cmd)+" "+p.stdout[-1400:]+p.stderr[-1400:])
    return p.stdout+"\n"+p.stderr
def cert(file):
    details=run(sdk/"apksigner.bat","verify","--print-certs",file)
    match=re.search("Signer #1 certificate SHA-256 digest:\\s*([0-9a-f]+)",details,re.I)
    if not match:raise ValueError("No certificate in "+str(file))
    return match.group(1).lower()
assert old.exists() and apk.exists() and aab.exists(),"Missing previous release or build"
assert cert(old)==cert(apk),"Signing certificate does not match Play Alpha 1.10"
old_pkg=run(sdk/"aapt.exe","dump","badging",old)
new_pkg=run(sdk/"aapt.exe","dump","badging",apk)
assert "name='com.piraligame.georgia'" in new_pkg
assert "versionCode='5'" in old_pkg
assert "versionCode='6'" in new_pkg and "versionName='1.0.11'" in new_pkg
assert "targetSdkVersion:'36'" in new_pkg
assert "jar verified" in run("jarsigner","-verify",aab).lower()
with zipfile.ZipFile(apk) as archive:
    files=archive.namelist()
    for fname in ["assets/public/index.html","assets/public/audio.js","assets/public/main.js","assets/public/vendor/three.module.js"]:
        assert fname in files,fname
    html=archive.read("assets/public/index.html").decode("utf-8")
    sound=archive.read("assets/public/audio.js").decode("utf-8")
    main=archive.read("assets/public/main.js").decode("utf-8")
    assert "ALPHA 1.11" in html
    assert "activeSfxVoices" in sound and "effectCooldown" in sound
    assert "./audio.js?v=1.11" in main
    assert "__GEORGIA_DEV" not in main
with zipfile.ZipFile(aab) as archive:
    assert "base/manifest/AndroidManifest.xml" in archive.namelist()
release=root/"Releases/Alpha-1.11"
downloads=root/"downloads/alpha111"
desktop=Path.home()/"OneDrive/Desktop/GEORGIA_GOOGLE_PLAY_UPLOAD_ALPHA_1.11"
for folder in (release,downloads,desktop):folder.mkdir(parents=True,exist_ok=True)
files_to_copy=[(aab,"GEORGIA-Alpha-1.11-signed.aab"),(apk,"GEORGIA-Alpha-1.11-Android.apk")]
for source,name in files_to_copy:
    for dest in (release,downloads,desktop):
        shutil.copy2(source,dest/name)
result={"status":"PASS","package":"com.piraligame.georgia","previousVersionCode":5,"versionCode":6,"versionName":"1.0.11","targetSdk":36,"sameReleaseCertificate":True,"signerSHA256":cert(apk),"aabBytes":aab.stat().st_size,"apkBytes":apk.stat().st_size,"audioThrottlingIncluded":True}
for folder in (release,downloads,desktop):
    (folder/"ANDROID_UPGRADE_CHECK.json").write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    (folder/"SHA256SUMS.txt").write_text("".join(f"{hashlib.sha256((folder/name).read_bytes()).hexdigest()}  {name}\n" for _,name in files_to_copy),encoding="utf-8")
print("GEORGIA_ALPHA_111_ANDROID_VERIFIED "+json.dumps(result),flush=True)
