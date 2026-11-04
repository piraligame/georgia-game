function resize(){
 const width=innerWidth,height=innerHeight,aspect=width/height;
 const view=(width<760?18.5:21.0)/cameraZoom;
 camera.left=-view*aspect;camera.right=view*aspect;camera.top=view;camera.bottom=-view;
 camera.updateProjectionMatrix();renderer.setSize(width,height);
}
addEventListener('resize',resize);resize();
$('zoomLabel').textContent=Math.round(cameraZoom*100)+'%';
$('zoomOutBtn').onclick=()=>setCameraZoom(cameraZoom-.085);
$('zoomInBtn').onclick=()=>setCameraZoom(cameraZoom+.085);
renderer.domElement.addEventListener('wheel',ev=>{
 if(!state.playing||state.paused)return;
 if(ev.shiftKey){ev.preventDefault();setCameraZoom(cameraZoom+(ev.deltaY<0?.045:-.045))}
},{passive:false});
addEventListener('keydown',ev=>{const k=ev.key.toLowerCase();keys[k]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))ev.preventDefault();if(k===' '&&!ev.repeat)dash();if(k==='q'&&!ev.repeat)build('wall');if(k==='e'&&!ev.repeat)build('tower');if(k==='r'&&!ev.repeat)upgrade();if(k==='f'&&!ev.repeat)(selectedEconomy?upgradeEconomy():upgradeStructure());if(k==='v'&&!ev.repeat)volley();if(k==='m'&&!ev.repeat)meteorStorm();if(k==='1'&&!ev.repeat)changeBuildMode('defense');if(k==='2'&&!ev.repeat)changeBuildMode('village');if(k==='g'&&!ev.repeat)recruitGuard();if(k==='p'&&!ev.repeat)(state.paused?closePause():openPause());if(k==='b'&&!ev.repeat)battleCry();
if(k==='h'&&!ev.repeat)recruitGuard('archer');if(k==='j'&&!ev.repeat)recruitGuard('healer');
if(k==='3'&&!ev.repeat)changeBuildMode('army');if(k==='-'&&!ev.repeat)setCameraZoom(cameraZoom-.08);if(k==='='&&!ev.repeat)setCameraZoom(cameraZoom+.08)});
addEventListener('keyup',ev=>{keys[ev.key.toLowerCase()]=false});
addEventListener('blur',()=>{for(const key in keys)keys[key]=false;releaseJoystick()});
const base=$('joystick'),stick=$('stick');
function setStick(x,y){stick.style.transform='translate('+x*28+'px,'+y*28+'px)'}
function moveStick(ev){
 if(joystick.pointer!==ev.pointerId)return;
 const dx=ev.clientX-joystick.cx,dy=ev.clientY-joystick.cy;
 const distance=Math.hypot(dx,dy),magnitude=Math.min(1,distance/49);
 const normalized=Math.max(0,(magnitude-joystick.deadZone)/(1-joystick.deadZone));
 const strength=normalized*normalized*.25+normalized*.75;
 const aimX=distance<1?0:dx/distance*strength;
 const aimY=distance<1?0:dy/distance*strength;
 joystick.x=THREE.MathUtils.lerp(joystick.x,aimX,.7);
 joystick.y=THREE.MathUtils.lerp(joystick.y,aimY,.7);
 setStick(joystick.x,joystick.y);
}
renderer.domElement.style.touchAction='none';
// PIRALI-style floating joystick. Any free touch on the bottom half of
// the battlefield activates movement. Touches in the upper half never do.
// Overlay buttons remain unaffected because this handler belongs to the canvas.
renderer.domElement.addEventListener('pointerdown',ev=>{
 if(!state.playing||state.dead||state.paused||state.betweenWaves||
    ev.pointerType==='mouse'||joystick.pointer!==null)return;
 if(!$('intro').classList.contains('hidden')||!$('pauseOverlay').classList.contains('hidden'))return;
 if(ev.clientY<innerHeight*.5)return;
 joystick.pointer=ev.pointerId;
 joystick.cx=ev.clientX;joystick.cy=ev.clientY;
 base.style.setProperty('left',joystick.cx+'px','important');
 base.style.setProperty('top',joystick.cy+'px','important');
 base.classList.add('active');
 try{renderer.domElement.setPointerCapture(ev.pointerId)}catch{}
 moveStick(ev);
},{passive:false});
renderer.domElement.addEventListener('pointermove',moveStick,{passive:false});
function releaseStick(ev){
 if(joystick.pointer!==ev.pointerId)return;
 releaseJoystick();
}
renderer.domElement.addEventListener('pointerup',releaseStick);
renderer.domElement.addEventListener('pointercancel',releaseStick);
window.addEventListener('pointerup',releaseStick);
window.addEventListener('pointercancel',releaseStick);
initThumbDash();

$('musicToggle').onclick=()=>{audio.unlock();audio.toggleMusic();renderAudioControls()};
$('sfxToggle').onclick=()=>{audio.unlock();audio.toggleSfx();renderAudioControls()};
renderAudioControls();
document.addEventListener('pointerdown',()=>{if(state.playing&&!audio.state().running)audio.unlock()},{passive:true});
$('rewardBow').onclick=()=>chooseReward('bow');
$('rewardFort').onclick=()=>chooseReward('fort');
$('rewardTower').onclick=()=>chooseReward('tower');
$('volleyBtn').onclick=volley;
$('meteorBtn').onclick=meteorStorm;
$('structureUpgradeBtn').onclick=()=>selectedEconomy&&state.economy.includes(selectedEconomy)?upgradeEconomy():upgradeStructure();
$('defenseTab').onclick=()=>changeBuildMode('defense');
$('armyTab').onclick=()=>changeBuildMode('army');
$('armyUpgradeBtn').onclick=trainArmy;
$('castleUpgradeBtn').onclick=upgradeCastle;
$('cryBtn').onclick=battleCry;
$('archerRecruitBtn').onclick=()=>recruitGuard('archer');
$('medicRecruitBtn').onclick=()=>recruitGuard('healer');
$('rewardArmy').onclick=()=>chooseReward('army');
$('villageTab').onclick=()=>changeBuildMode('village');
for(const kind of economyNames)if($(kind+'Btn'))$(kind+'Btn').onclick=()=>buildEconomy(kind);
$('recruitBtn').onclick=()=>recruitGuard('sword');
$('pauseBtn').onclick=()=>state.paused?closePause():openPause();
$('resumeBtn').onclick=closePause;
$('menuReturnBtn').onclick=returnToMainMenu;
$('saveBtn').onclick=()=>saveCheckpoint();
$('restartBtn').onclick=()=>{
 if(!restartArmed){restartArmed=true;$('restartBtn').textContent='დადასტურება ↻';return}
 closePause();reset();saveCheckpoint(true);
};
$('continueBtn').onclick=restoreSnapshot;
$('cycleBuildingBtn').onclick=cycleWorldBuilding;
$('recruitNearbyBtn').onclick=()=>{
  const roles=['sword','archer','healer'];recruitGuard(roles[state.guards.length%roles.length])
};
$('upgradeHeroQuick').onclick=upgrade;
$('wallBtn').onclick=()=>build('wall');$('towerBtn').onclick=()=>build('tower');$('trapBtn').onclick=()=>build('trap');$('ballistaBtn').onclick=()=>build('ballista');$('upgradeBtn').onclick=upgrade;$('healBtn').onclick=heal;$('dashBtn').onclick=dash;$('startBtn').onclick=()=>{audio.unlock();reset();saveCheckpoint(true)};$('againBtn').onclick=()=>{audio.unlock();reset();saveCheckpoint(true)};
camera.position.copy(cameraFollowPosition(hero.group.position));
camera.lookAt(hero.group.position.x,1.05,hero.group.position.z);showRecord();hasCheckpoint();ui();updateMissions();drawMiniMap();requestAnimationFrame(frame);

