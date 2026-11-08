from pathlib import Path
root=Path(__file__).resolve().parent.parent

def replace_exact(path,old,new):
    text=path.read_text(encoding="utf-8")
    n=text.count(old)
    if n!=1: raise RuntimeError(f"{path.name}: expected one occurrence of {old!r}, got {n}")
    path.write_text(text.replace(old,new),encoding="utf-8")

audio=root/"audio.js"
replace_exact(audio,"  let waveFlavor=0,lastImpact=-100,lastDamage=-100;",
"""  let waveFlavor=0,lastImpact=-100,lastDamage=-100;
  // Android WebView may deliver many combat events in one render frame.
  // Separate polyphony budgets and per-effect cooldowns keep the mixer bounded.
  let activeMusicVoices=0,activeSfxVoices=0;
  const effectCooldown={arrow:.105,impact:.115,coin:.09,build:.22,upgrade:.18,damage:.22,dash:.20,wave:.70,defeat:1.2};
  const lastEffect=Object.create(null);""")
replace_exact(audio,"    ctx=new Audio();","    ctx=new Audio({latencyHint:'playback'});")
replace_exact(audio,
"""  function osc(type,hz,time,duration,volume,bus=musicBus,slide=null){
    if(!ctx)return;
    const tone=ctx.createOscillator();tone.type=type;tone.frequency.setValueAtTime(Math.max(25,hz),time);
    if(slide)tone.frequency.exponentialRampToValueAtTime(Math.max(25,slide),time+duration*.8);
    const amp=envelope(bus,time,duration,volume,Math.min(.06,duration*.12));
    tone.connect(amp);tone.start(time);tone.stop(time+duration+.025);
  }""",
"""  function osc(type,hz,time,duration,volume,bus=musicBus,slide=null){
    if(!ctx||ctx.state!=='running')return;
    const fx=bus===sfxBus;
    if(fx?activeSfxVoices>=14:activeMusicVoices>=24)return;
    if(fx)activeSfxVoices++;else activeMusicVoices++;
    const tone=ctx.createOscillator();tone.type=type;tone.frequency.setValueAtTime(Math.max(25,hz),time);
    if(slide)tone.frequency.exponentialRampToValueAtTime(Math.max(25,slide),time+duration*.8);
    const amp=envelope(bus,time,duration,volume,Math.min(.06,duration*.12));
    tone.connect(amp);
    tone.onended=()=>{
      tone.disconnect();amp.disconnect();
      if(fx)activeSfxVoices=Math.max(0,activeSfxVoices-1);
      else activeMusicVoices=Math.max(0,activeMusicVoices-1);
    };
    tone.start(time);tone.stop(time+duration+.025);
  }""")
replace_exact(audio,
"""  function noise(time,duration,volume,cutoff=2200){
    if(!ctx||!noiseBuffer)return;
    const src=ctx.createBufferSource();src.buffer=noiseBuffer;
    const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=cutoff;
    const amp=envelope(sfxBus,time,duration,volume,.005);
    src.connect(filter);filter.connect(amp);src.start(time);src.stop(time+duration+.01);
  }""",
"""  function noise(time,duration,volume,cutoff=2200){
    if(!ctx||ctx.state!=='running'||!noiseBuffer||activeSfxVoices>=14)return;
    activeSfxVoices++;
    const src=ctx.createBufferSource();src.buffer=noiseBuffer;
    const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=cutoff;
    const amp=envelope(sfxBus,time,duration,volume,.005);
    src.connect(filter);filter.connect(amp);
    src.onended=()=>{
      src.disconnect();filter.disconnect();amp.disconnect();
      activeSfxVoices=Math.max(0,activeSfxVoices-1);
    };
    src.start(time);src.stop(time+duration+.01);
  }""")
replace_exact(audio,
"""    let n=0;
    while(nextNote<ctx.currentTime+.40 && n++<14){""",
"""    // Skip late notes rather than scheduling an audible burst after a frame stall.
    if(nextNote<ctx.currentTime-.20)nextNote=ctx.currentTime+.06;
    let n=0;
    while(nextNote<ctx.currentTime+.28 && n++<8){""")
replace_exact(audio,
"""    const t=ctx.currentTime+.001,p=Math.min(1.2,Math.max(.06,power));
    switch(kind){""",
"""    const t=ctx.currentTime+.006,p=Math.min(1.2,Math.max(.06,power));
    const prev=lastEffect[kind]??-100;
    if(t-prev<(effectCooldown[kind]??.1))return;
    lastEffect[kind]=t;
    switch(kind){""")
replace_exact(audio,"    nextNote=ctx.currentTime+.10;step=0;timer=setInterval(schedule,125);schedule();",
              "    nextNote=ctx.currentTime+.12;step=0;timer=setInterval(schedule,160);schedule();")
replace_exact(root/"src/game/00-scene-environment.js","./audio.js?v=0.4","./audio.js?v=1.11")
for fname in ("index.html","developer.html"):
    p=root/fname
    data=p.read_text(encoding="utf-8")
    if data.count("1.10")<5: raise RuntimeError(f"{fname}: missing expected version labels")
    p.write_text(data.replace("1.10","1.11"),encoding="utf-8")
replace_exact(root/"android/app/build.gradle",
              'versionCode 5\n        versionName "1.0.10"',
              'versionCode 6\n        versionName "1.0.11"')
notes=root/"RELEASE_NOTES_1.11.md"
notes.write_text("""# GEORGIA Alpha 1.11 — Android Audio Stability Candidate

- Keeps the same Android package, keystore and signed release certificate as the Alpha 1.10 Play test.
- Increases versionCode from 5 to 6, versionName 1.0.11, target SDK 36.
- Limits simultaneous procedural Web Audio voices separately for music and sound effects.
- Debounces repeated hit, coin, build, arrow and damage effects during large battles.
- Skips overdue music notes rather than issuing bursts when the render thread stalls.
- Changes audio latency hint to playback to prioritize a stable buffer in Android WebView.
- Retains save progression, player-only packaging, joystick controls, and bilingual UI.
- This addresses the reported foldable phone regression but requires device testing on Samsung Z Fold 7 to confirm.
- GEORGIA files only; PIRALI files are unchanged.
""",encoding="utf-8")
print("GEORGIA_ALPHA_111_PREPARED")
