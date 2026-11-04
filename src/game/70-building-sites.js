function setWorldBillboard(label,position,level=2){
 if(worldBillboardText!==label){
   const ctx=worldLabelCanvas.getContext('2d');
   ctx.clearRect(0,0,560,140);ctx.fillStyle='#183b2fec';ctx.strokeStyle='#f6d18d';
   ctx.lineWidth=6;ctx.beginPath();ctx.roundRect(6,8,548,123,24);ctx.fill();ctx.stroke();
   ctx.font='bold 31px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ffefc4';
   ctx.fillText(label,280,71,530);worldLabelTex.needsUpdate=true;worldBillboardText=label;
 }
 worldBillboard.visible=true;
 worldBillboard.position.set(position.x,level,position.z);
}
function identifyWorldItem(){
 const candidates=[];
 for(let i=0;i<slots.length;i++){
   const slot=slots[i];
   const distance=dist2(hero.group.position,slot.group.position);
   if(distance<4.4){
     const b=state.builds.find(b=>b.slot===slot)||null;
     if(b&&b.level>=4)continue;
     candidates.push({id:'d'+i,kind:slot.kind,slot,building:b,pos:slot.group.position,distance,
      cost:b?{coins:structureCost(b),wood:0}:defensePrices[slot.kind],
      stage:b?b.level+1:1,maxStage:4,title:slot.kind==='wall'?'🧱 '+fortressWalls[b?b.level+1:1].name:defenseNames[slot.kind]});
   }
 }
 for(let i=0;i<economyPlots.length;i++){
   const plot=economyPlots[i];
   const distance=dist2(hero.group.position,plot.group.position);
   if(distance<4.4){
     const b=plot.building;
     const kind=b?.kind||plot.preferredKind;
     candidates.push({id:'v'+i,kind,plot,building:b,pos:plot.group.position,distance,
       cost:b?economyUpgradePrice(b):economyCost(kind),
       stage:b?Math.min(3,b.level+1):1,maxStage:3,title:economyDefinitions[kind].name});
   }
 }
 candidates.sort((a,b)=>a.distance-b.distance);
 // During rapid movement, keep the same site selected for a few seconds
 // after building/upgrading, provided David is still nearby.
 if(stickyTargetId&&performance.now()<stickyUntil){
   const pinned=candidates.find(x=>x.id===stickyTargetId);
   if(pinned)return pinned;
 }
 return candidates[0]||null;
}
// Physical coin sparks travel from David toward each construction deposit pad.
const depositedCoins=[];
const coinBeamMaterial=materials.gold;
const depositSpotRing=new THREE.Group();scene.add(depositSpotRing);
const depositRingMesh=mesh(depositSpotRing,new THREE.RingGeometry(1.05,1.26,32),
 new THREE.MeshBasicMaterial({color:0xf3c36b,transparent:true,opacity:.70,depthWrite:false,
 side:THREE.DoubleSide}),0,.045,0);
depositRingMesh.rotation.x=-Math.PI/2;depositRingMesh.castShadow=false;
depositSpotRing.visible=false;
function addCoinDepositFx(destination,amount){
 if(depositedCoins.length>18)return;
 const coin=new THREE.Group();coin.position.copy(hero.group.position);coin.position.y=1.3;
 const disk=cyl(coin,.18,.18,.075,coinBeamMaterial);disk.rotation.z=Math.PI/2;
 coin.scale.setScalar(.90);scene.add(coin);
 depositedCoins.push({group:coin,start:coin.position.clone(),end:new THREE.Vector3(
    destination.x,.22,destination.z),age:0,duration:.42});
}
function tickDepositVisuals(dt){
 for(const fx of [...depositedCoins]){
  fx.age+=dt;const t=Math.min(1,fx.age/fx.duration),ease=1-Math.pow(1-t,2);
  fx.group.position.lerpVectors(fx.start,fx.end,ease);
  fx.group.position.y+=Math.sin(t*Math.PI)*.05;
  fx.group.rotation.z+=dt*11;
  fx.group.scale.setScalar(Math.max(.05,(1-t)*1.05));
  if(t>=1){
    scene.remove(fx.group);fx.group.traverse(n=>{if(n.geometry)n.geometry.dispose()});
    depositedCoins.splice(depositedCoins.indexOf(fx),1);
  }
 }
 if(depositSpotRing.visible){
   const pulse=1+Math.sin(performance.now()*.005)*.08;
   depositSpotRing.scale.setScalar(pulse);
 }
}
function resetWorldPayment(){
 siteChoicesOpen=false;troopMenuOpen=false;contextUiTimer=0;siteRecentlyBuilt=0;stickyTargetId=null;stickyUntil=0;
 $('siteDock').classList.add('hidden');$('troopDock').classList.add('hidden');
 $('siteChoices').classList.add('hidden');$('troopChoices').classList.add('hidden');
 paymentLockKey='';paymentLockPos=null;worldTargetKey='';worldPaymentTimer=0;worldContextItem=null;
 worldBillboard.visible=false;worldBillboardText='';depositSpotRing.visible=false;
 for(const fx of [...depositedCoins]){scene.remove(fx.group);fx.group.traverse(n=>{if(n.geometry)n.geometry.dispose()})};depositedCoins.length=0;
 $('worldBuildInfo').classList.add('hidden');$('contextActions').classList.add('hidden');
 for(const slot of slots)slot.deposit=0;
 for(const plot of economyPlots){plot.deposit=0;plot.preferredKind=economyNames[plot.index%economyNames.length];paintEconomySign(plot)}
}
// Alpha 1.02: Build ONLY after a deliberate tap. Never auto-spend resources on approach.
let siteChoicesOpen=false,troopMenuOpen=false,contextUiTimer=0,siteRecentlyBuilt=0,stickyTargetId=null,stickyUntil=0;
const buildChoiceKeys=[...economyNames];
const siteChoiceArea=$('siteChoices');
function canActNow(){return state.playing&&!state.dead&&!state.paused&&!state.betweenWaves}
function siteDeposit(item){return item.slot?(item.slot.deposit||0):(item.plot.deposit||0)}
function depositCostRemaining(item){return Math.max(0,item.cost.coins-siteDeposit(item))}
function affordableSite(item){
 return state.coins>=depositCostRemaining(item)&&state.wood>=item.cost.wood
}
function completeSite(item){
 if(!item||!canActNow())return false;
 if(item.slot){
   selectedSlot=item.slot;selectedBuild=item.building||null;
   if(item.building)upgradeStructure(true);
   else build(item.kind,true);
 }else{
   selectedEconomyPlot=item.plot;selectedEconomy=item.building||null;
   if(item.building)upgradeEconomy(true);
   else buildEconomy(item.kind,item.plot,false,true);
 }
 if(item.slot)item.slot.deposit=0;else item.plot.deposit=0;
 paymentLockKey='';paymentLockPos=null;siteRecentlyBuilt=.22;stickyTargetId=item.id;stickyUntil=performance.now()+5000;
 worldBillboardText='';worldPaymentTimer=0;
 saveCheckpoint(true);
 showToast('🏗️ '+item.title+' • დონე '+item.stage+' დასრულდა!');
 return true;
}
function repairFortress(){
 if(!canActNow()||!nearCastle())return false;
 const missing=state.maxFortHP-state.fortHP;
 if(missing<10){showToast('🏰 ნარიყალას გამძლეობა სავსეა');return false}
 const cost=Math.min(45,Math.max(18,Math.ceil(missing/15)));
 if(state.coins<cost||state.wood<3){showToast('🔧 საჭიროა 🪙 '+cost+' 🌲3');return false}
 state.coins-=cost;state.wood-=3;
 state.fortHP=Math.min(state.maxFortHP,state.fortHP+Math.max(95,state.maxFortHP*.15));
 for(let i=0;i<14;i++)particle(castle.position.x+rand(-2,2),rand(1,4),castle.position.z+rand(-2,2),0x9fe8c6);
 audio.play('upgrade',.65);saveCheckpoint(true);showToast('🛠️ ნარიყალა შეკეთებულია');return true;
}
$('fortRepairBtn').onclick=()=>{repairFortress();updateWorldConstruction(0)};
function nearCastle(){return dist2(hero.group.position,castle.position)<2.8}
function currentEconomyBuilding(){
 const item=identifyWorldItem();
 return item?.plot&&item.building?item.building:null;
}
function hireWorkerAtSite(){
 if(!canActNow())return false;
 const b=currentEconomyBuilding();if(!b)return false;
 const max=4,cost=35+(b.workers||0)*25;
 if((b.workers||0)>=max){showToast('👷 ყველა სამუშაო ადგილი დაკავებულია');return false}
 if(state.coins<cost){showToast('👷 საჭიროა 🪙'+cost);return false}
 state.coins-=cost;b.workers=(b.workers||0)+1;
 audio.play('build',.5);
 for(let i=0;i<7;i++)particle(b.group.position.x+rand(-1,1),rand(.4,2),b.group.position.z,0xffd78f);
 showToast('👷 მუშა დაიქირავე! სულ '+b.workers+' • '+economyDefinitions[b.kind].name);
 saveCheckpoint(true);updateWorldConstruction(0);return true;
}
function forgeWeaponAtSite(){
 if(!canActNow())return false;
 const b=currentEconomyBuilding();if(!b||b.kind!=='forge')return false;
 const upgrades=state.weaponLevel||0;
 const cost=70+upgrades*65,wood=4+upgrades*3;
 if(upgrades>=7){showToast('🏹 მშვილდი მაქსიმალურად გაძლიერებულია');return false}
 if(state.coins<cost||state.wood<wood){showToast('⚒️ საჭიროა 🪙'+cost+' 🌲'+wood);return false}
 state.coins-=cost;state.wood-=wood;state.weaponLevel=upgrades+1;
 state.damage+=5;state.shotInterval=Math.max(.235,state.shotInterval-.015);
 audio.play('upgrade');showToast('⚒️ მშვილდი გაძლიერდა • LV '+state.weaponLevel+'/7');
 saveCheckpoint(true);updateWorldConstruction(0);return true;
}
$('siteWorkerBtn').onclick=hireWorkerAtSite;
$('siteWeaponBtn').onclick=forgeWeaponAtSite;
function buildAtCurrentSite(){
 if(!canActNow()||siteRecentlyBuilt>0)return false;
 const item=identifyWorldItem();
 if(!item){if(nearCastle()){upgradeCastle();updateWorldConstruction(0);return true}showToast('🏗️ მიუახლოვდი სამშენებლო ადგილს');return false}
 const coins=depositCostRemaining(item),wood=item.cost.wood;
 if(state.coins<coins||state.wood<wood){
   showToast('საჭიროა 🪙 '+coins+' და 🌲 '+wood);
   return false;
 }
 state.coins-=coins;
 for(let i=0;i<Math.min(5,Math.ceil(coins/12));i++)addCoinDepositFx(item.pos,coins);
 const complete=completeSite(item);
 if(!complete){state.coins+=coins;return false}
 audio.play('build',.9);
 updateWorldConstruction(0);
 return true;
}
function selectSiteBuilding(kind){
 const item=identifyWorldItem();
 if(!item||!item.plot||item.building||!economyDefinitions[kind])return;
 const plot=item.plot;
 if(plot.deposit){state.coins+=plot.deposit;plot.deposit=0}
 plot.preferredKind=kind;
 paintEconomySign(plot);
 siteChoicesOpen=false;
 worldBillboardText='';
 saveCheckpoint(true);
 updateWorldConstruction(0);
 showToast(economyDefinitions[kind].name+' არჩეულია • დააჭირე „აშენება“');
}
function createSiteChoiceButtons(){
 siteChoiceArea.replaceChildren();
 for(const kind of buildChoiceKeys){
   const def=economyDefinitions[kind];
   const btn=document.createElement('button');
   btn.type='button';btn.dataset.buildKind=kind;
   btn.innerHTML='<b>'+def.name+'</b><span class="cost">🪙 '+def.coins+' 🌲 '+def.wood+' • '+def.description+'</span>';
   btn.onclick=()=>selectSiteBuilding(kind);
   siteChoiceArea.append(btn);
 }
}
createSiteChoiceButtons();
$('siteChooseBtn').onclick=()=>{
 if(!identifyWorldItem()?.plot)return;
 siteChoicesOpen=!siteChoicesOpen;
 $('siteChoices').classList.toggle('hidden',!siteChoicesOpen);
};
$('siteBuildBtn').onclick=buildAtCurrentSite;
function closestBarracks(){
 return state.economy.find(b=>b.kind==='barracks'&&dist2(hero.group.position,b.group.position)<6.0)||null;
}
$('troopToggle').onclick=()=>{
 if(!closestBarracks())return;
 troopMenuOpen=!troopMenuOpen;
 $('troopChoices').classList.toggle('hidden',!troopMenuOpen);
 updateWorldConstruction(0);
};
for(const [id,kind] of [
 ['hireSword','sword'],['hireArcher','archer'],['hireHealer','healer'],
 ['hireSpear','spear'],['hireCavalry','cavalry']
]){
 $(id).onclick=()=>{
   if(!closestBarracks())return;
   recruitGuard(kind);
   updateWorldConstruction(0);
 };
}
$('trainTroops').onclick=()=>{
 if(!closestBarracks())return;
 trainArmy();
 updateWorldConstruction(0);
};
function updateWorldConstruction(dt){
 siteRecentlyBuilt=Math.max(0,siteRecentlyBuilt-dt);
 // Keep the GL scene smooth on phones; contextual DOM only needs ~8 FPS.
 contextUiTimer-=dt;
 if(dt>0&&contextUiTimer>0)return;
 contextUiTimer=.12;
 const item=identifyWorldItem();
 worldContextItem=item;
 const nearBarracks=Boolean(closestBarracks());
 if(!nearBarracks)troopMenuOpen=false;
 const troopDock=$('troopDock'),siteDock=$('siteDock');
 troopDock.classList.toggle('hidden',!nearBarracks||!state.playing||state.dead||state.paused||state.betweenWaves);
 $('troopChoices').classList.toggle('hidden',!troopMenuOpen||!nearBarracks);
 $('troopCount').textContent=state.guards.length+'/9'+(nearBarracks?' · '+Math.ceil(closestBarracks().spawnTimer||60)+'წ':'');
 const castleContext=!item&&nearCastle();
 if((!item&&!castleContext)||!canActNow()){
   $('siteWorkerBtn').classList.add('hidden');$('siteWeaponBtn').classList.add('hidden');
   siteDock.classList.add('hidden');
   worldBillboard.visible=false;
   depositSpotRing.visible=false;
   worldBillboardText='';
   if(!item)siteChoicesOpen=false;
 }else if(castleContext){
   $('siteWorkerBtn').classList.add('hidden');$('siteWeaponBtn').classList.add('hidden');
   siteDock.classList.toggle('hidden',troopMenuOpen&&nearBarracks);
   siteDock.classList.toggle('has-troops',nearBarracks);
   $('siteTitle').textContent='🏰 ნარიყალას ციხე';
   $('siteLevel').textContent='ციხის დონე '+state.castleLevel+'/5';
   $('siteHint').textContent='❤️ '+Math.ceil(state.fortHP)+' / '+state.maxFortHP+' • ციხის გაძლიერება';
   const price=castleUpgradeCost();
   $('siteBuildBtn').textContent=state.castleLevel>=5?'⭐ მაქსიმუმი':'⬆️ ციხის გაუმჯობესება • 🪙'+price.coins+' 🌲'+price.wood;
   $('siteBuildBtn').disabled=state.castleLevel>=5||state.coins<price.coins||state.wood<price.wood;
   $('siteChooseBtn').classList.add('hidden');$('siteChoices').classList.add('hidden');
   $('fortRepairBtn').classList.toggle('hidden',state.fortHP>=state.maxFortHP-10);
   $('fortRepairBtn').textContent='🛠️ შეკეთება • 🪙'+Math.min(45,Math.max(18,Math.ceil((state.maxFortHP-state.fortHP)/15)))+' 🌲3';
   $('siteFeedback').textContent=state.castleLevel>=5?'ციხე მაქსიმალურ დონეზეა':'დაიცავი ციხე და განავითარე';
   depositSpotRing.visible=false;worldBillboard.visible=false;
 }else{
   $('fortRepairBtn').classList.add('hidden');
   siteDock.classList.toggle('hidden',troopMenuOpen&&nearBarracks);
   siteDock.classList.toggle('has-troops',nearBarracks);
   depositSpotRing.visible=true;depositSpotRing.position.set(item.pos.x,0,item.pos.z);
   const wood=item.cost.wood;
   const amount=depositCostRemaining(item);
   $('siteTitle').textContent=item.title;
   $('siteLevel').textContent='დონე '+item.stage+' / '+item.maxStage;
   $('siteHint').textContent=item.building?'არსებული ნაგებობის განვითარება':'სამშენებლო ადგილი • აირჩიე რა აშენდეს';
   $('siteFeedback').textContent=state.coins<amount?
      '🪙 კიდევ საჭიროა '+(amount-state.coins)+' მონეტა':
      state.wood<wood?'🌲 კიდევ საჭიროა '+(wood-state.wood)+' ხე':'✅ საკმარისი რესურსია';
   $('siteBuildBtn').textContent=(item.building&&item.building.level>=item.maxStage?'⭐ MAX':item.building?'⬆️ გააძლიერე':'🏗️ აშენება')+
       ' • 🪙'+amount+(wood?' 🌲'+wood:'');
   $('siteBuildBtn').disabled=!!item.building&&item.building.level>=item.maxStage||
     !affordableSite(item)||siteRecentlyBuilt>0;
   const staff=item.plot&&item.building?item.building:null;
   $('siteWorkerBtn').classList.toggle('hidden',!staff||!['lumber','farm','workshop','forge','quarry','market','barracks','stable','infirmary'].includes(staff.kind));
   if(staff){
     const cost=35+(staff.workers||0)*25;
     $('siteWorkerBtn').textContent='👷 მუშა '+(staff.workers||0)+'/4 • 🪙'+cost;
     $('siteWorkerBtn').disabled=staff.workers>=4||state.coins<cost;
   }
   $('siteWeaponBtn').classList.toggle('hidden',!staff||staff.kind!=='forge');
   if(staff?.kind==='forge'){
     const up=state.weaponLevel||0,cost=70+up*65,wood=4+up*3;
     $('siteWeaponBtn').textContent='🏹 მშვილდი LV'+up+'/7 • 🪙'+cost+' 🌲'+wood;
     $('siteWeaponBtn').disabled=up>=7||state.coins<cost||state.wood<wood;
   }
   $('siteChooseBtn').classList.toggle('hidden',!item.plot||Boolean(item.building));
   $('siteChooseBtn').textContent='🏘️ '+(item.plot&&!item.building?'შეცვალე: '+economyDefinitions[item.kind].name:'შენობა');
   $('siteChoices').classList.toggle('hidden',!siteChoicesOpen||!item.plot||Boolean(item.building));
   if(siteChoicesOpen)for(const btn of siteChoiceArea.children)
     btn.classList.toggle('selected',btn.dataset.buildKind===item.kind);
   // Show a tiny price marker only when the player is within the site.
   setWorldBillboard(item.title+' 🪙'+amount,item.pos,
     item.slot?(item.kind==='wall'?5.15:item.kind==='tower'?5.3:item.kind==='ballista'?3.1:1.45):4.4);
 }
 $('worldBuildInfo').classList.add('hidden');
 $('contextActions').classList.add('hidden');
 if(troopMenuOpen&&nearBarracks){
   const barracks=closestBarracks();
   const unlockedLv=barracks?.level||1;
   for(const [id,role] of [
    ['hireSword','sword'],['hireArcher','archer'],['hireHealer','healer'],
    ['hireSpear','spear'],['hireCavalry','cavalry']
   ]){
     const def=unitDefinitions[role];
     const unlockOk=role!=='spear'||unlockedLv>=2;
     const cavalryOk=role!=='cavalry'||(unlockedLv>=3&&state.economy.some(x=>x.kind==='stable'));
     const btn=$(id);
     btn.innerHTML='<b>'+def.name+'</b><span class="cost">🪙'+def.coins+' 🌲'+def.wood+
        (!unlockOk?' • ყაზარმა LV2':!cavalryOk?' • ყაზარმა LV3 + საჯინიბო':'')+'</span>';
     btn.disabled=!unlockOk||!cavalryOk||state.guards.length>=9||
       state.coins<def.coins||state.wood<def.wood;
   }
   const cost=armyUpgradeCost();
   $('trainTroops').innerHTML='<b>⭐ გაწვრთენი ჯარი LV'+state.armyLevel+'/5</b>'+
      '<span class="cost">🪙'+cost.coins+' 🌲'+cost.wood+'</span>';
   $('trainTroops').disabled=state.armyLevel>=5||state.coins<cost.coins||state.wood<cost.wood;
   $('troopDescription').textContent='🛡️ საკუთარი ჯარი • '+state.guards.length+'/9 • შემდეგი მცველი '+Math.ceil(barracks?.spawnTimer??60)+' წმ';
   $('formationBtn').textContent='🎖️ ბრძანება: '+formationNames[state.armyFormation||'follow'];
 }
}
// Kept for backwards-compatible keyboard/controller mappings. The primary
// build UX is explicit single-tap and the named selection list, not blind cycling.
function cycleWorldBuilding(){
 const item=identifyWorldItem();
 if(item?.plot&&!item.building){
   const ix=economyNames.indexOf(item.plot.preferredKind);
   selectSiteBuilding(economyNames[(ix+1)%economyNames.length]);
 }
}
// Recruited allied guards: real actors that patrol, escort and defend the kingdom.
function barracksCount(){return state.economy.filter(b=>b.kind==='barracks').length}
const formationNames={follow:'🚶 გამომყევი',defend:'🏰 დაიცავი ნარიყალა',attack:'⚔️ შეუტიე'};
const formationSequence=['follow','defend','attack'];
