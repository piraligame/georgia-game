const state={playing:false,dead:false,coins:185,wood:75,meteorCd:0,effects:[],score:0,combo:0,comboTimer:0,armyLevel:1,armyFormation:'follow',weaponLevel:0,castleLevel:1,cryCd:0,battleCryTime:0,missionStep:0,missionRewards:0,totalConstruction:0,recruited:0,missionTicker:.1,hp:130,maxHp:130,fortHP:720,maxFortHP:720,
 wave:1,kills:0,level:1,damage:35,attackCd:0,shotInterval:.38,towerBonus:0,towerSpeed:0,
 spawnCd:0,waveLeft:0,spawned:0,waveTotal:0,siegeMode:false,supportWaves:0,supportStage:0,supportQueued:0,supportSpawned:0,supportCd:0,builds:[],enemies:[],shots:[],pickups:[],particles:[],
 villagers:[],economy:[],guards:[],enemyShots:[],hazards:[],villagerGoal:1,rescued:0,lost:0,totalRescued:0,settlementTier:0,villageIncomeTimer:15,
 dashCd:0,dashTime:0,volleyCd:0,lastTime:0,waveWait:0,betweenWaves:false,paused:false,waveEvent:'normal',miniTimer:0,uiCd:0};
// All armies keep their complete human/horse models at every viewing distance.
 // The former cylinder/sphere distant substitute was removed; no model popping.
 const consistentEnemySilhouettes=true;
let facing=new THREE.Vector3(0,0,-1),movement=new THREE.Vector2(0,0),lastToast=0;
const keys={};
const joystick={x:0,y:0,pointer:null,cx:0,cy:0,deadZone:.09};
// PIRALI-style floating joystick: appears under the finger anywhere in the lower half.
function releaseJoystick(){
 joystick.pointer=null;joystick.x=0;joystick.y=0;
 const base=$('joystick');
 if(base)base.classList.remove('active');
 if($('stick'))$('stick').style.transform='translate(0px,0px)';
}
function joystickCenter(){
 const base=$('joystick');
 const bounds=base.getBoundingClientRect();
 return {x:joystick.cx||bounds.left+bounds.width/2,
   y:joystick.cy||bounds.top+bounds.height/2,allowed:true};
}
function initThumbDash(){
 const thumbDash=document.createElement('button');
 thumbDash.id='thumbDashBtn';thumbDash.type='button';
 thumbDash.textContent='⚡';
 thumbDash.setAttribute('aria-label','სწრაფი მოძრაობა');
 thumbDash.addEventListener('click',dash);
 document.body.append(thumbDash);
}

function pauseForInterruption(){
 if(!state.playing||state.dead)return;
 saveCheckpoint(true);
 if(!state.paused)openPause();
 for(const key in keys)keys[key]=false;
 releaseJoystick();
}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)pauseForInterruption();
});
window.addEventListener('pagehide',pauseForInterruption);
window.addEventListener('blur',pauseForInterruption);
// The village grows from rescues instead of appearing fully built at the beginning.
const settlementObjects=[];
