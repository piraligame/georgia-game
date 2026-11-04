function clearCheckpoint(){
 for(const key of [checkpointKey,alpha09CheckpointKey,previousCheckpointKey,legacyCheckpointKey]){
   try{localStorage.removeItem(key)}catch{}
 }
 hasCheckpoint();
}
function loadSnapshot(){
 try{
   let data=null;
   for(const key of [checkpointKey,alpha09CheckpointKey,previousCheckpointKey,legacyCheckpointKey]){
     try{data=JSON.parse(localStorage.getItem(key)||'null')}catch{data=null}
     if(data&&[7,8,9,10].includes(data.version)&&Number.isInteger(data.wave)&&
       data.wave>=1&&data.wave<=250&&Array.isArray(data.builds)&&
       Array.isArray(data.economy)&&Array.isArray(data.guards))return data;
   }
   return null;
 }catch{return null}
}
function hasCheckpoint(){
 const info=loadSnapshot();
 $('continueBtn').classList.toggle('hidden',!info);
 return Boolean(info);
}
function createSnapshot(){
 return{
   version:10,created:new Date().toISOString(),
   castleLevel:state.castleLevel,armyLevel:state.armyLevel,cryCd:state.cryCd,
   score:state.score,weaponLevel:state.weaponLevel||0,armyFormation:state.armyFormation,meteorCd:state.meteorCd,missionStep:state.missionStep,missionRewards:state.missionRewards,
   totalConstruction:state.totalConstruction,recruited:state.recruited,
   wave:state.wave,kills:state.kills,coins:state.coins,wood:state.wood,
   hp:state.hp,maxHp:state.maxHp,fortHP:state.fortHP,maxFortHP:state.maxFortHP,
   level:state.level,damage:state.damage,shotInterval:state.shotInterval,
   towerBonus:state.towerBonus,towerSpeed:state.towerSpeed,
   settlementTier:state.settlementTier,totalRescued:state.totalRescued,
   villageIncomeTimer:state.villageIncomeTimer,volleyCd:state.volleyCd,
   pos:[hero.group.position.x,hero.group.position.z],
   builds:state.builds.map(b=>({slot:slots.indexOf(b.slot),kind:b.kind,level:b.level,hp:b.hp,maxHp:b.maxHp})),
   economy:state.economy.map(b=>({plot:b.plot.index,kind:b.kind,level:b.level,hp:b.hp,maxHp:b.maxHp,tick:b.tick,workers:b.workers||0,spawnTimer:b.spawnTimer??60,spawnPeriod:60})),
   guards:state.guards.map(g=>({role:g.role,hp:g.hp,maxHp:g.maxHp,damage:g.damage})),
   worldDeposits:{defense:slots.map(x=>x.deposit||0),village:economyPlots.map(x=>x.deposit||0),
     preferred:economyPlots.map(x=>x.preferredKind)}, 
 };
}
function saveCheckpoint(silent=false){
 if(!state.playing||state.dead)return false;
 try{localStorage.setItem(checkpointKey,JSON.stringify(createSnapshot()));hasCheckpoint();
   if(!silent){audio.play('coin',.55);showToast('💾 სამეფოს პროგრესი შენახულია')}
   return true;
 }catch{if(!silent)showToast('⚠️ შენახვა ვერ მოხერხდა');return false}
}
function restoreSnapshot(){
 const snap=loadSnapshot();if(!snap){showToast('შენახული თამაში არ მოიძებნა');return false}
 audio.unlock();reset();
 // Build castle walls and towers first. Restore them without subtracting saved resources.
 const resources={coins:snap.coins,wood:snap.wood};
 state.coins=999999;state.wood=999999;
 for(const item of snap.builds.slice(0,slots.length)){
   const slot=slots[item.slot];
   if(!slot||slot.occupied||slot.kind!==item.kind)continue;
   hero.group.position.copy(slot.group.position);selectedSlot=slot;
   build(item.kind);
   const b=state.builds[state.builds.length-1];if(!b)continue;
   b.level=Math.max(1,Math.min(4,Number(item.level)||1));
   b.maxHp=Math.max(10,Number(item.maxHp)||b.maxHp);b.hp=Math.min(b.maxHp,Math.max(1,Number(item.hp)||b.maxHp));
   if(b.kind==='wall')rebuildWall(b);else if(b.kind==='tower')rebuildTower(b);else decorateBuilding(b);makeUpgradeTag(b);optimizeBuildingVisual(b);
 }
 for(const item of snap.economy.slice(0,economyPlots.length)){
   const plot=economyPlots[item.plot];if(!plot||plot.occupied||!economyDefinitions[item.kind])continue;
   if(!buildEconomy(item.kind,plot,true))continue;
   const b=state.economy[state.economy.length-1];
   b.level=Math.max(1,Math.min(3,Number(item.level)||1));
   b.maxHp=Math.max(20,Number(item.maxHp)||b.maxHp);b.hp=Math.min(b.maxHp,Math.max(1,Number(item.hp)||b.maxHp));
   b.tick=Math.max(.2,Number(item.tick)||economyDefinitions[b.kind].interval);
   b.workers=Math.max(0,Math.min(4,Number(item.workers)||0));
   // Alpha 1.04 saves had a five-second timer: migrate those to 60 seconds.
   b.spawnTimer=b.kind==='barracks'&&item.spawnPeriod!==60?60:
      Math.max(.2,Math.min(60,Number(item.spawnTimer)||60));
   if(b.level>1){
      const decor=makeEconomyModel(b.kind,b.level);b.group.add(decor);b.decor=decor;
      for(const child of [...b.group.children])if(child!==decor&&child!==b.hit&&child!==b.label){b.group.remove(child);disposeActor(child)};
   }
   makeEconomyLabel(b);optimizeBuildingVisual(b);
 }
 state.armyLevel=Math.max(1,Math.min(5,snap.armyLevel||1));
 if(snap.worldDeposits){
  for(let i=0;i<slots.length;i++)slots[i].deposit=Math.max(0,Math.min(500,Number(snap.worldDeposits.defense?.[i])||0));
  for(let i=0;i<economyPlots.length;i++){
    const plot=economyPlots[i];
    plot.deposit=Math.max(0,Math.min(500,Number(snap.worldDeposits.village?.[i])||0));
    const pref=snap.worldDeposits.preferred?.[i];
    if(economyDefinitions[pref])plot.preferredKind=pref;
   paintEconomySign(plot);
  }
 }
 const maxGuards=Math.min(9,snap.guards.length);
 for(let i=0;i<maxGuards;i++){
   const role=unitDefinitions[snap.guards[i].role]?snap.guards[i].role:'sword';
   if(!recruitGuard(role,true))break;
   const b=state.guards[state.guards.length-1],a=snap.guards[i];
   b.maxHp=Math.max(1,Number(a.maxHp)||b.maxHp);b.hp=Math.max(1,Math.min(b.maxHp,Number(a.hp)||b.maxHp));
   b.damage=Math.max(1,Number(a.damage)||b.damage);
 }
 for(let i=1;i<=Math.min(3,snap.settlementTier||0);i++)addSettlementTier(i);
 state.castleLevel=Math.max(1,Math.min(5,snap.castleLevel||1));
 renderCastleLevel();
 Object.assign(state,{
   wave:Math.max(1,Math.min(250,snap.wave)),kills:Math.max(0,snap.kills||0),
   score:Math.max(0,snap.score||0),
   armyLevel:Math.max(1,Math.min(5,snap.armyLevel||1)),
   armyFormation:formationNames[snap.armyFormation]?snap.armyFormation:'follow',weaponLevel:Math.max(0,Math.min(7,snap.weaponLevel||0)),
   castleLevel:Math.max(1,Math.min(5,snap.castleLevel||1)),
   cryCd:Math.max(0,snap.cryCd||0),meteorCd:Math.max(0,snap.meteorCd||0),battleCryTime:0,
   missionStep:Math.max(0,snap.missionStep||0),
   missionRewards:Math.max(0,snap.missionRewards||0),
   totalConstruction:Math.max(0,snap.totalConstruction??(snap.builds.length+snap.economy.length)),
   recruited:Math.max(0,snap.recruited??snap.guards.length),
   coins:Math.max(0,snap.coins||0),wood:Math.max(0,snap.wood||0),
   hp:Math.max(1,snap.hp||100),maxHp:Math.max(50,snap.maxHp||100),
   fortHP:Math.max(1,snap.fortHP||500),maxFortHP:Math.max(100,snap.maxFortHP||500),
   level:Math.max(1,snap.level||1),damage:Math.max(10,snap.damage||24),
   shotInterval:Math.max(.20,snap.shotInterval||.43),
   towerBonus:Math.max(0,snap.towerBonus||0),towerSpeed:Math.max(0,snap.towerSpeed||0),
   totalRescued:Math.max(0,snap.totalRescued||0),
   settlementTier:Math.max(0,Math.min(3,snap.settlementTier||0)),
   villageIncomeTimer:Math.max(.5,snap.villageIncomeTimer||15),volleyCd:Math.max(0,snap.volleyCd||0)
 });
 hero.group.scale.setScalar(1.10+Math.min(state.level-1,4)*.045);
 hero.group.position.set(
   THREE.MathUtils.clamp(Number(snap.pos?.[0])||2,-78,78),0,
   THREE.MathUtils.clamp(Number(snap.pos?.[1])||6.5,-78,78)
 );
 selectedBuild=null;selectedEconomy=null;selectedSlot=null;selectedEconomyPlot=null;
 state.shots.length=0;
 beginWave(); // The current wave restarts; no half-spawned enemies get serialized.
 changeBuildMode('defense');
 $('pauseOverlay').classList.add('hidden');
 state.paused=false;
 saveCheckpoint(true); // Preserve all Alpha 0.7–0.9 backups and upgrade to version 10.
 showToast('💾 Alpha 0.9 • შენახული სამეფო აღდგენილია • ტალღა '+state.wave);
 ui();updateMissions();return true;
}
function openPause(){
 if(!state.playing||state.dead)return;
 saveCheckpoint(true);
 $('siteDock').classList.add('hidden');$('troopDock').classList.add('hidden');
 state.paused=true;
 $('pauseSummary').textContent='ტალღა '+state.wave+' • 🪙 '+state.coins+' • 🌲 '+state.wood+
  ' • 🛡️ '+state.guards.length+' მცველი • 🏰 '+Math.ceil(state.fortHP)+' HP';
 $('pauseOverlay').classList.remove('hidden');
 restartArmed=false;$('restartBtn').textContent='↻ თავიდან დაწყება';
}
function closePause(){
 state.paused=false;contextUiTimer=0;state.lastTime=performance.now();$('pauseOverlay').classList.add('hidden');
 for(const key in keys)keys[key]=false;
}
function returnToMainMenu(){releaseJoystick();
 saveCheckpoint(true);state.playing=false;state.paused=true;
 $('pauseOverlay').classList.add('hidden');$('rewardOverlay').classList.add('hidden');
 $('intro').classList.remove('hidden');$('center').style.pointerEvents='auto';
 joystick.pointer=null;joystick.x=0;joystick.y=0;
 hasCheckpoint();
}
// Narikala's primary construction loop: physically walk ON a site and deposit coins.
// Each step places coins in the site; progress persists when the player walks away.
let worldPaymentTimer=0,worldTargetKey='',paymentLockKey='',paymentLockPos=null;
let worldContextItem=null,worldBillboardText='',worldBoardMaterial=null,worldContextCooldown=0;
const worldLabelCanvas=document.createElement('canvas');worldLabelCanvas.width=560;worldLabelCanvas.height=140;
const worldLabelTex=new THREE.CanvasTexture(worldLabelCanvas);worldLabelTex.colorSpace=THREE.SRGBColorSpace;
worldLabelTex.minFilter=THREE.LinearFilter;
const worldBillboard=new THREE.Sprite(new THREE.SpriteMaterial({map:worldLabelTex,transparent:true,depthTest:false,depthWrite:false}));
worldBillboard.scale.set(3.1,.76,1);worldBillboard.visible=false;scene.add(worldBillboard);
