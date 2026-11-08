// GEORGIA Alpha 0.4 — entirely original procedural ambient score and sound design.
// Uses Web Audio only: no copyrighted music, network audio files, or autoplay workarounds.
export function createGameAudio(){
  const KEY='georgia-audio-v1';
  let prefs={music:true,sfx:true};
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');prefs={...prefs,...saved}}catch{}
  let ctx=null,master=null,musicBus=null,sfxBus=null,noiseBuffer=null;
  let timer=null,step=0,nextNote=0,started=false,lastShot=-100;
  let waveFlavor=0,lastImpact=-100,lastDamage=-100;
  // Android WebView may deliver many combat events in one render frame.
  // Separate polyphony budgets and per-effect cooldowns keep the mixer bounded.
  let activeMusicVoices=0,activeSfxVoices=0;
  const effectCooldown={arrow:.105,impact:.115,coin:.09,build:.22,upgrade:.18,damage:.22,dash:.20,wave:.70,defeat:1.2};
  const lastEffect=Object.create(null);
  const MIDI=n=>440*Math.pow(2,(n-69)/12);
  function create(){
    if(ctx)return;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    ctx=new Audio({latencyHint:'playback'});
    master=ctx.createGain();master.gain.value=.82;
    const limiter=ctx.createDynamicsCompressor();
    limiter.threshold.value=-16;limiter.ratio.value=3.2;limiter.attack.value=.004;limiter.release.value=.2;
    master.connect(limiter);limiter.connect(ctx.destination);
    musicBus=ctx.createGain();musicBus.gain.value=prefs.music?.25:0;musicBus.connect(master);
    sfxBus=ctx.createGain();sfxBus.gain.value=prefs.sfx?.56:0;sfxBus.connect(master);
    const rate=ctx.sampleRate,buffer=ctx.createBuffer(1,Math.floor(rate*.48),rate);
    const samples=buffer.getChannelData(0);
    for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.pow(1-i/samples.length,.8);
    noiseBuffer=buffer;
  }
  function preserve(){
    try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch{}
  }
  function envelope(bus,time,duration,volume,attack=.014){
    const g=ctx.createGain();g.gain.setValueAtTime(.0001,time);
    g.gain.exponentialRampToValueAtTime(Math.max(.0003,volume),time+attack);
    g.gain.exponentialRampToValueAtTime(.0001,time+duration);
    g.connect(bus);return g;
  }
  function osc(type,hz,time,duration,volume,bus=musicBus,slide=null){
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
  }
  function noise(time,duration,volume,cutoff=2200){
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
  }
  function pluck(note,time,volume=.10){
    const hz=MIDI(note);
    osc('triangle',hz,time,1.5,volume,musicBus);
    osc('sine',hz*2,time,.62,volume*.30,musicBus);
  }
  function pad(notes,time,duration){
    for(let i=0;i<notes.length;i++){
      const hz=MIDI(notes[i]);osc('sine',hz,time,duration,.048-i*.007,musicBus);
      if(i===0)osc('triangle',hz*.5,time,duration,.031,musicBus);
    }
  }
  // Original eight-bar D-minor / modal melody. No preexisting composition is sampled.
  const tune=[
    62,null,65,69,67,null,65,null,
    62,null,60,62,65,null,57,null,
    60,null,64,67,65,null,62,null,
    60,null,57,60,62,null,57,null,
    62,null,65,69,72,69,67,null,
    65,null,62,65,67,null,65,null,
    60,null,64,67,69,null,65,null,
    62,null,60,57,62,null,62,null
  ];
  const chords=[[50,57,62],[48,55,60],[53,60,65],[50,57,62],
                [50,57,62],[46,53,58],[48,55,60],[50,57,62]];
  const beat=60/86/2;
  function schedule(){
    if(!ctx||ctx.state!=='running'||!prefs.music||!started)return;
    // Skip late notes rather than scheduling an audible burst after a frame stall.
    if(nextNote<ctx.currentTime-.20)nextNote=ctx.currentTime+.06;
    let n=0;
    while(nextNote<ctx.currentTime+.28 && n++<8){
      const index=step%tune.length, chord=Math.floor(index/8)%chords.length;
      if(index%8===0)pad(chords[chord],nextNote,beat*8.4);
      if(tune[index]!=null)pluck(tune[index],nextNote,index%8===0?.12:.085);
      if(index%8===4)pluck(chords[chord][0]+12,nextNote,.032);
      if(waveFlavor>0 && index%4===0)osc('sine',MIDI(chords[chord][0]-12),nextNote,.42,.012,musicBus);
      step++;nextNote+=beat;
    }
  }
  function startMusic(){
    if(!ctx||!prefs.music||timer)return;
    nextNote=ctx.currentTime+.12;step=0;timer=setInterval(schedule,160);schedule();
  }
  function stopMusic(){if(timer){clearInterval(timer);timer=null}}
  async function unlock(){
    try{
      create();if(!ctx)return false;
      await ctx.resume();
      if(!started){started=true;startMusic()}else if(prefs.music&&!timer){startMusic()}
      return ctx.state==='running';
    }catch{return false}
  }
  function play(kind,power=1){
    if(!ctx||ctx.state!=='running'||!prefs.sfx||document.hidden)return;
    const t=ctx.currentTime+.006,p=Math.min(1.2,Math.max(.06,power));
    const prev=lastEffect[kind]??-100;
    if(t-prev<(effectCooldown[kind]??.1))return;
    lastEffect[kind]=t;
    switch(kind){
      case 'arrow':{
        if(t-lastShot<.072)return;lastShot=t;
        osc('triangle',410,t,.095,.11*p,sfxBus,160);
        osc('sine',205,t,.11,.065*p,sfxBus,88);
        noise(t,.12,.048*p,2600);break;
      }
      case 'impact':
        if(t-lastImpact<.06)return;lastImpact=t;
        noise(t,.082,.14*p,1600);osc('triangle',175,t,.12,.095*p,sfxBus,74);break;
      case 'coin':
        osc('sine',710,t,.13,.09*p,sfxBus,870);
        osc('triangle',1100,t+.065,.16,.06*p,sfxBus);break;
      case 'build':
        noise(t,.14,.1*p,660);osc('triangle',160,t,.20,.10*p,sfxBus,95);
        osc('sine',370,t+.11,.22,.05*p,sfxBus,450);break;
      case 'upgrade':
        for(const [i,hz] of [440,554,659,880].entries())osc('sine',hz,t+i*.07,.25,.09*p,sfxBus);
        break;
      case 'damage':
        if(t-lastDamage<.13)return;lastDamage=t;
        noise(t,.18,.17*p,1250);osc('sawtooth',115,t,.19,.065*p,sfxBus,55);break;
      case 'dash':
        noise(t,.18,.12*p,3800);osc('sine',290,t,.17,.075*p,sfxBus,650);break;
      case 'wave':
        for(const [i,hz] of [294,392,440,587].entries())osc('triangle',hz,t+i*.13,.49,.07*p,sfxBus);
        waveFlavor=1;break;
      case 'defeat':
        for(const [i,hz] of [330,277,220].entries())osc('triangle',hz,t+i*.17,.64,.10*p,sfxBus);
        waveFlavor=0;break;
    }
  }
  function toggleMusic(){
    prefs.music=!prefs.music;preserve();
    if(musicBus&&ctx)musicBus.gain.setTargetAtTime(prefs.music?.25:0,ctx.currentTime,.08);
    if(prefs.music){if(ctx&&started)startMusic()}else{stopMusic()}
    return prefs.music;
  }
  function toggleSfx(){
    prefs.sfx=!prefs.sfx;preserve();
    if(sfxBus&&ctx)sfxBus.gain.setTargetAtTime(prefs.sfx?.56:0,ctx.currentTime,.05);
    return prefs.sfx;
  }
  function state(){return {...prefs,running:!!ctx&&ctx.state==='running',musicActive:!!timer,supported:!!(window.AudioContext||window.webkitAudioContext)}}
  document.addEventListener('visibilitychange',()=>{
    if(!ctx)return;
    if(document.hidden){stopMusic();ctx.suspend().catch(()=>{})}
    // Resume only on a real user gesture; page focus doesn't bypass browser autoplay policy.
  });
  return {unlock,play,toggleMusic,toggleSfx,state,stopMusic};
}
