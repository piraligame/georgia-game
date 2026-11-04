if(location.pathname.toLowerCase().includes('developer')){
const panel=document.createElement('aside');panel.id='devPanel';panel.innerHTML='<div class="devtitle">🛠️ DEVELOPER • GEORGIA 1.09 • ნარიყალა</div><button id="devMoney">🪙 +1000</button><button id="devWood">🌲 +100</button><button id="devGuard">🛡️ მცველი</button><button id="devArcher">🏹 მოკავშირე</button><button id="devHealer">💚 მკურნალი</button><button id="devSiege">🪵 ტარანი</button><button id="devHorde">🔥 დიდი ტალღა</button><button id="devBuild">🎯 ბალისტა</button><button id="devSave">💾 Save</button><button id="devGod">🛡️ უკვდავება OFF</button><button id="devSkip">⏩ შემდეგი ტალღა</button><button id="devFull">❤️ შევსება</button><button id="devWalls">🏰 ყველა ნაგებობა</button>';document.body.append(panel);
panel.classList.add('dev-closed');
const toggle=document.createElement('button');
toggle.id='devToggle';toggle.type='button';
toggle.textContent='🛠️ DEV';toggle.setAttribute('aria-label','დეველოპერის ბრძანებების გახსნა');
toggle.setAttribute('aria-expanded','false');document.body.append(toggle);
toggle.onclick=()=>{
  const open=panel.classList.toggle('dev-closed')===false;
  toggle.setAttribute('aria-expanded',String(open));
  toggle.textContent=open?'✕ DEV':'🛠️ DEV';
};
$('devMoney').onclick=()=>{state.coins+=1000;ui();showToast('🪙 +1000')};
$('devWood').onclick=()=>{state.wood+=100;ui();showToast('🌲 +100')};
$('devGuard').onclick=()=>{state.coins+=35;state.wood+=3;recruitGuard('sword',true);ui()};
$('devArcher').onclick=()=>{recruitGuard('archer',true);ui()};
$('devHealer').onclick=()=>{recruitGuard('healer',true);ui()};
$('devSiege').onclick=()=>{if(!state.playing)return;state.wave=5;state.waveTotal=1;state.spawned=0;makeEnemy();state.waveLeft=0;ui()};
$('devHorde').onclick=()=>{if(!state.playing)return;state.coins+=900;
  for(let i=0;i<20;i++){state.spawned++;makeEnemy()}state.spawned-=20;ui();showToast('⚔️ 20 მტერი!')};
$('devBuild').onclick=()=>{
 if(!state.playing)return;
 const slot=slots.find(x=>x.kind==='ballista'&&!x.occupied);
 if(!slot)return;
 state.coins+=100;state.wood+=20;hero.group.position.copy(slot.group.position);selectedSlot=slot;build('ballista');ui();
};
$('devSave').onclick=()=>saveCheckpoint();
$('devGod').onclick=()=>{const enabled=state.maxHp<5000;if(enabled){state.maxHp=99999;state.hp=99999;}else{state.maxHp=100+(state.level-1)*18;state.hp=state.maxHp}$('devGod').textContent='🛡️ უკვდავება '+(enabled?'ON':'OFF');ui();};
$('devSkip').onclick=()=>{if(!state.playing)return;for(const e of state.enemies){scene.remove(e.group);disposeActor(e.group)}state.enemies.length=0;state.waveLeft=0;state.supportQueued=0;state.supportStage=state.supportWaves;state.waveWait=2.5;showToast('⏩ შემდეგი ტალღა')};
$('devFull').onclick=()=>{state.hp=state.maxHp;state.fortHP=state.maxFortHP;ui();showToast('❤️ შევსებულია')};
$('devWalls').onclick=()=>{if(!state.playing)return;state.coins+=3000;for(const slot of [...slots]){if(!slot.occupied){hero.group.position.set(slot.group.position.x,0,slot.group.position.z+2);selectedSlot=slot;build(slot.kind)}}hero.group.position.set(2,0,6.5);ui()};
}

if(location.pathname.toLowerCase().includes('developer'))window.__GEORGIA_DEV={state,hero,slots,audio,getGraphicsInfo:()=>({...renderer.info.render,fullModels:state.enemies.filter(e=>e.group.visible).length}),getJoystickInfo:()=>({side:joystick.side,pointer:joystick.pointer,x:joystick.x,y:joystick.y,center:joystickCenter()}),economyPlots,resourceNodes,buildEconomy,upgradeEconomy,tickEconomy,
    recruitGuard,updateGuards,makeEnemy,scheduleEnemyReinforcements,paintEconomySign,hitEnemy,shoot,beginWave,bossWarning,saveCheckpoint,restoreSnapshot,decideWaveEvent,battleCry,upgradeCastle,trainArmy,missionProgress,meteorStorm,setCameraZoom,identifyWorldItem,updateWorldConstruction,resetWorldPayment,depositedCoins,depositSpotRing,
    volley,chooseReward,spawnVillagers,presentWaveRewards,get selected(){return selectedBuild},upgradeStructure};
