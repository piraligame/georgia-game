function addSettlementTier(tier){
  const spots=[[11.8,11.8],[-12.0,11.8],[12.0,-12.0]];
  const [x,z]=spots[tier-1];
  const g=new THREE.Group();g.position.set(x,0,z);
  const timber=mat(0x835a35),pastel=mat(0xd9cba2),roof=mat(tier===2?0x547996:0x9a6943);
  const soil=mesh(g,new THREE.CircleGeometry(3.2,16),new THREE.MeshBasicMaterial({
    color:0x8e9b54,transparent:true,opacity:.52,side:THREE.DoubleSide
  }),0,.021,0);soil.rotation.x=-Math.PI/2;soil.castShadow=false;
  if(tier===1){
    for(const bx of [-1.5,-.6,.3,1.2]){
      const patch=cube(g,.45,.18,2.15,mat(0x826c43),bx,.10,0);
      for(let j=0;j<5;j++)cone(g,.12,.31,materials.green,bx,.38,-.8+j*.4);
    }
    cube(g,1.10,1.20,1.15,pastel,-1.0,.6,-2.0);
    cone(g,.9,1.0,roof,-1.0,1.75,-2.0);
  }else if(tier===2){
    cube(g,2.6,1.85,2.1,pastel,0,1,0);
    cube(g,2.85,.12,2.3,timber,0,1.95,0);
    cone(g,2.1,1.55,roof,0,2.65,0);
    for(const bx of [-.8,.8])cube(g,.48,.48,.10,materials.dark,bx,1.12,1.08);
    cube(g,.68,1.2,.12,timber,0,.75,1.12);
  }else{
    const base=cyl(g,1.55,1.72,.55,materials.wall,0,.26,0);
    for(const bx of [-1,1])for(const bz of [-1,1])cyl(g,.15,.2,.74,materials.wood,bx,.65,bz);
    cube(g,2.65,.12,2.65,timber,0,1.16,0);
    cone(g,1.95,1.24,roof,0,1.90,0);
    cube(g,1.6,1.0,1.5,pastel,0,.67,0);
  }
  scene.add(g);settlementObjects.push(g);
  for(let j=0;j<9;j++)particle(x+rand(-1.6,1.6),rand(.6,1.8),z+rand(-1.6,1.6),0xf1d08b);
}
function growSettlement(){
  const desired=state.totalRescued>=9?3:state.totalRescued>=5?2:state.totalRescued>=2?1:0;
  while(state.settlementTier<desired){
    state.settlementTier++;addSettlementTier(state.settlementTier);
    state.maxFortHP+=25;
    state.fortHP=Math.min(state.maxFortHP,state.fortHP+50);
    showToast('🏡 სოფელი გაიზარდა • დონე '+state.settlementTier);
    audio.play('upgrade',.8);
  }
}
function tickSettlement(dt){
  if(state.totalRescued<=0)return;
  state.villageIncomeTimer-=dt;
  if(state.villageIncomeTimer<=0){
    state.villageIncomeTimer+=15;
    const earn=6+state.settlementTier*6;
    state.coins+=earn;
    audio.play('coin',.25);
    showToast('🌾 სოფლის შემოსავალი +'+earn+' 🪙');
  }
}
const RECORD_KEY=location.pathname.toLowerCase().includes('developer')?'georgia-dev-best-wave-v1':'georgia-best-wave-v1';
const bestRecord={wave:0,kills:0,rescued:0};
try{Object.assign(bestRecord,JSON.parse(localStorage.getItem(RECORD_KEY)||'{}'))}catch{}
function showRecord(){
  $('bestRecord').textContent='🏆 რეკორდი: '+bestRecord.wave+' ტალღა • '+bestRecord.kills+' მტერი';
}
function saveRecord(waveCompleted=0){
  bestRecord.wave=Math.max(bestRecord.wave,waveCompleted);
  bestRecord.kills=Math.max(bestRecord.kills,state.kills);
  bestRecord.rescued=Math.max(bestRecord.rescued,state.totalRescued);
  try{localStorage.setItem(RECORD_KEY,JSON.stringify(bestRecord))}catch{}
  showRecord();
}
// Readable lightweight minimap for phones: player, fortress, threats, troops and buildings.
const miniMapCanvas=$('miniMap'),miniCtx=miniMapCanvas.getContext('2d');
function drawMiniMap(){
 const c=miniCtx,w=miniMapCanvas.width,h=miniMapCanvas.height;
 c.clearRect(0,0,w,h);c.fillStyle='#102a28df';c.fillRect(0,0,w,h);
 c.strokeStyle='#91b09a48';c.lineWidth=1;
 for(let k=1;k<=3;k++){c.beginPath();c.arc(w/2,h/2,k*15,0,Math.PI*2);c.stroke()}
 const world=79;const toXY=v=>[w/2+(v.x/world)*(w*.46),h/2+(v.z/world)*(h*.46)];
 const point=(position,color,size=2.5)=>{
   const [x,y]=toXY(position);if(x<0||y<0||x>w||y>h)return;
   c.fillStyle=color;c.beginPath();c.arc(x,y,size,0,Math.PI*2);c.fill();
 };
 for(const b of state.builds)point(b.group.position,b.kind==='tower'?'#e5d594':'#bec4a7',2.9);
 for(const b of state.economy)point(b.group.position,'#84c7a1',3);
 for(const n of resourceNodes)if(n.group.visible)point(n.group.position,'#c2a16e',1.2);
 for(const v of state.villagers)point(v.group.position,'#f0e59d',2.6);
 for(const e of state.enemies)point(e.group.position,e.type==='captain'?'#ffb74e':e.type==='ram'?'#ffc64f':'#e67c70',e.type==='captain'||e.type==='ram'?3.8:2.2);
 for(const g of state.guards)point(g.group.position,'#8de8f0',2.5);
 point(castle.position,'#fff0ae',4.3);
 point(hero.group.position,'#66f2c4',4.2);
 c.strokeStyle='#e2d7a2ae';c.lineWidth=2;c.strokeRect(1,1,w-2,h-2);
 c.fillStyle='#fff0ad';c.font='bold 12px sans-serif';c.fillText('N',w/2-5,12);
}
// Distinct attacks and events, with warnings before boss area strikes.
const visualPalettes={
  normal:{sky:0x94cabe,sun:0xffe8bb,intensity:2.10,hemi:1.95},
  rush:{sky:0xadd6af,sun:0xffe8ac,intensity:2.27,hemi:2.10},
  archers:{sky:0x9abdc1,sun:0xd4e8ff,intensity:1.80,hemi:1.85},
  siege:{sky:0xc4ab8d,sun:0xffb785,intensity:1.85,hemi:1.75},
  captain:{sky:0x998c9a,sun:0xe9a8b9,intensity:1.70,hemi:1.70}
};
const tempSkyColor=new THREE.Color(),tempSunColor=new THREE.Color();
function updateWeather(dt){
 const mood=visualPalettes[state.waveEvent]||visualPalettes.normal;
 tempSkyColor.setHex(mood.sky);tempSunColor.setHex(mood.sun);
 const factor=Math.min(1,dt*.40);
 scene.background.lerp(tempSkyColor,factor);
 scene.fog.color.lerp(tempSkyColor,factor);
 sun.color.lerp(tempSunColor,factor);
 sun.intensity=THREE.MathUtils.lerp(sun.intensity,mood.intensity,factor);
 hemiLight.intensity=THREE.MathUtils.lerp(hemiLight.intensity,mood.hemi,factor);
}
// Separate HISTORICAL FANTASY chapters: distinct real centuries, fictional knight and battles.
const georgiaChapters=[
 {title:'I • არაბთა ლაშქრობა',subtitle:'VIII საუკუნით შთაგონებული • თბილისის დაცვა',era:'arab'},
 {title:'II • სელჩუკთა შემოსევა',subtitle:'XI საუკუნე • მხედრები და მშვილდოსნები',era:'seljuk'},
 {title:'III • ხვარაზმელთა ლაშქრობა',subtitle:'XIII საუკუნე • მძიმე რაზმები',era:'khwarezm'},
 {title:'IV • მონღოლთა ალყა',subtitle:'XIII საუკუნე • მონღოლთა მხედრობა',era:'mongol'},
 {title:'V • თემურის ლაშქრობები',subtitle:'XIV–XV საუკუნეები • ტიმურიდთა სარდლები',era:'timurid'},
 {title:'VI • ოსმალთა ლაშქრობა',subtitle:'XVI საუკუნე • მტრის დიდი ალყა',era:'ottoman'},
 {title:'VII • შაჰ-აბასის სპარსეთი',subtitle:'XVII საუკუნე • საფავიდთა რაზმები',era:'safavid'},
 {title:'VIII • რუსეთის იმპერიის ჯარი',subtitle:'XIX საუკუნე • ოფიცრები და მუშკეტერები',era:'russian'}
];
function eraForWave(wave){return georgiaChapters[Math.floor((wave-1)/4)%georgiaChapters.length]}
function showChapter(){
 const era=eraForWave(state.wave);
 $('chapterTitle').textContent='🏰 '+era.title+' • ტალღა '+state.wave;
 $('chapterMission').textContent=era.subtitle;
}
function createHorse(group){
 const animal=new THREE.Group();group.add(animal);
 const fur=mat(0x735038),darker=mat(0x4f3225),leather=mat(0x936240);
 const torso=cube(animal,1.04,.79,1.70,fur,0,.89,-.02);
 const neck=cyl(animal,.24,.34,.85,fur,0,1.38,.61);neck.rotation.x=-.30;
 const face=cube(animal,.43,.46,.72,fur,0,1.62,.84);
 for(const x of [-.34,.34])for(const z of [-.54,.56]){
   const leg=cyl(animal,.11,.14,.77,darker,x,.40,z);
   leg.rotation.x=rand(-.16,.16);
   cube(animal,.24,.18,.32,materials.dark,x,.11,z+.04);
 }
 for(const x of [-.16,.16])cone(animal,.10,.30,darker,x,1.98,.66);
 const saddle=cube(animal,1.14,.13,.66,mat(0x9c4740),0,1.34,-.08);
 const tail=cone(animal,.18,.64,darker,0,.94,-1.06);tail.rotation.x=-.5;
 return animal;
}
function decideWaveEvent(wave){
 if(wave%4===0)return 'captain';
 if(wave%5===0)return 'siege';
 if(wave%3===0)return 'archers';
 if(wave%2===0)return 'rush';
 return 'normal';
}
const eventLabels={
 normal:'🛡️ დაიცავი ციხე და სოფელი',
 rush:'⚡ სწრაფი მტრის ნაკადი!',
 archers:'🏹 მტრის მშვილდოსნები!',
 siege:'🔥 დიდი ალყა • მტრის ახალი რაზმები!',
 captain:'👑 კაპიტანი და ელიტური ჯარი!'
};
// Defensive structures are real combat targets, including tower and ballista.
function damageStructure(building,damage){
 if(!building||!(state.builds.includes(building)||state.economy.includes(building)))return;
 building.hp=Math.max(0,building.hp-damage);
 if(building.hp>0){
   if(Math.random()<.4)particle(building.group.position.x,1.3,building.group.position.z,0xf4a46c);
   return;
 }
 scene.remove(building.group);disposeActor(building.group);
 if(state.builds.includes(building)){
   state.builds.splice(state.builds.indexOf(building),1);
   building.slot.occupied=false;building.slot.group.visible=true;
   if(selectedSlot===building.slot)selectedSlot=null;
   if(selectedBuild===building)selectedBuild=null;
   showToast(building.kind==='tower'?'🏹 მტერმა კოშკი დაანგრია!':
     building.kind==='ballista'?'🎯 ბალისტა განადგურდა!':'🧱 გალავანი დაინგრა • აღადგინე');
 }else{
   state.economy.splice(state.economy.indexOf(building),1);
   building.plot.occupied=false;building.plot.building=null;building.plot.group.visible=true;
   if(selectedEconomy===building)selectedEconomy=null;
   showToast('🔥 სოფლის შენობა განადგურდა!');
 }
 // A destroyed tower is no longer an eligible attack target.
 for(const e of state.enemies)if(e.targetObj===building){e.targetObj=null;e.targetRefresh=0;}
}
// Towers are a priority even before the attacker reaches the fortress walls.
function chooseEnemyObjective(enemy){
 const ep=enemy.group.position;
 const targets=[...state.builds,...state.economy,...(enemy.type==='ram'?[]:state.guards)];
 let best=null,bestScore=Infinity;
 const max=enemy.type==='archer'?31:enemy.type==='ram'?28:22;
 for(const b of targets){
   const distance=dist2(ep,b.group.position);
   if(distance>max)continue;
   let factor=b.kind==='tower'?.57:b.kind==='ballista'?.60:
     b.kind==='wall'?.78:b.kind==='trap'?.8:b.kind==='guard'?.97:.85;
   if(enemy.type==='ram'&&(b.kind==='wall'||b.kind==='tower'))factor*=.80;
   const score=distance*factor;
   if(score<bestScore){bestScore=score;best=b}
 }
 return best;
}
function launchEnemyArrow(enemy,targetType,targetObject=null){
 const arrow=new THREE.Group();const start=enemy.group.position;
 arrow.position.set(start.x,1.54,start.z);
 if(enemy.faction==='russian'){
   sphere(arrow,.14,materials.wall,0,0,0);
 }else{
   const darkFeather=materials.red;
   cyl(arrow,.045,.045,1.06,materials.wood);
   cone(arrow,.13,.29,materials.wall,0,.69,0);
   cube(arrow,.21,.045,.10,darkFeather,0,-.42,0);
   cube(arrow,.10,.045,.20,darkFeather,0,-.42,0);
 }
 scene.add(arrow);
 const aim=targetType==='hero'?hero.group.position.clone():
    (targetType==='guard'||targetType==='structure')&&targetObject?targetObject.group.position.clone():castle.position.clone();
 state.enemyShots.push({mesh:arrow,aim,targetType,targetObject,life:2.25,speed:15.5,damage:(9+state.wave*.9)*2});
 audio.play('arrow',.24);
}
function updateEnemyShots(dt){
 for(const shot of [...state.enemyShots]){
   shot.life-=dt;
   const target=shot.aim;
   if(!target||shot.life<=0||!shot.mesh){disposeProjectile(shot.mesh);state.enemyShots.splice(state.enemyShots.indexOf(shot),1);continue}
   const destination=new THREE.Vector3(target.x,shot.targetType==='hero'?1.05:shot.targetType==='guard'?1:shot.targetType==='structure'?2:2.2,target.z);
   const v=destination.sub(shot.mesh.position),length=v.length();
   if(length<.46+shot.speed*dt){
     disposeProjectile(shot.mesh);state.enemyShots.splice(state.enemyShots.indexOf(shot),1);
     if(shot.targetType==='hero'){
       if(dist2(hero.group.position,shot.aim)<1.25&&state.dashTime<=0)
         state.hp=Math.max(0,state.hp-shot.damage);
       if(state.hp<=0)endGame('hero');
     }else if(shot.targetType==='guard'){
       if(state.guards.includes(shot.targetObject)&&dist2(shot.targetObject.group.position,shot.aim)<1.35)
         damageGuard(shot.targetObject,shot.damage);
     }else if(shot.targetType==='structure'){
       damageStructure(shot.targetObject,shot.damage);
     }else{
       state.fortHP=Math.max(0,state.fortHP-shot.damage);
       if(state.fortHP<=0)endGame('castle');
     }
     for(let i=0;i<4;i++)particle(target.x,1.1,target.z,0xf4a571);
   }else{
     shot.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize());
     shot.mesh.position.addScaledVector(v.normalize(),shot.speed*dt);
   }
 }
}
function bossWarning(enemy){
 if(state.hazards.length>=4)return;
 const position=hero.group.position.clone();position.y=.022;
 const group=new THREE.Group();group.position.copy(position);
 const matRed=new THREE.MeshBasicMaterial({color:0xe95a4f,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false});
 const disc=mesh(group,new THREE.CircleGeometry(2.4,40),matRed);disc.rotation.x=-Math.PI/2;disc.castShadow=false;
 const ring=mesh(group,new THREE.RingGeometry(2.31,2.48,40),
   new THREE.MeshBasicMaterial({color:0xff9a72,transparent:true,opacity:.73,side:THREE.DoubleSide,depthWrite:false}));
 ring.rotation.x=-Math.PI/2;ring.castShadow=false;ring.position.y=.014;
 scene.add(group);
 state.hazards.push({group,position,ring,disc,time:.92,done:false});
 showToast('⚠️ კაპიტანის დარტყმა — გაერიდე წითელ ზონას!');
}
function updateHazards(dt){
 if(state.dead)return;
 for(const h of [...state.hazards]){
   h.time-=dt;
   h.ring.scale.setScalar(1+.035*Math.sin(h.time*26));
   h.disc.material.opacity=.12+.12*(1-Math.max(0,h.time)/.92);
   if(!h.done&&h.time<=0){
     h.done=true;
     if(dist2(hero.group.position,h.position)<2.5&&state.dashTime<=0){
       state.hp=Math.max(0,state.hp-(23+state.wave*.6)*2);
       audio.play('damage',.8);
       if(state.hp<=0)endGame('hero');
     }
     for(const g of [...state.guards])if(dist2(g.group.position,h.position)<2.5)damageGuard(g,58);
     for(let i=0;i<13;i++)particle(h.position.x+rand(-1.9,1.9),rand(.5,1.3),h.position.z+rand(-1.9,1.9),0xff945f);
     h.time=-.25;
   }
   if(h.done&&h.time<-.40){
     scene.remove(h.group);state.hazards.splice(state.hazards.indexOf(h),1);
   }
 }
}
// Resource scavenging: collect scattered firewood piles by walking near them.
const resourceNodes=[];
function relocateResourceNode(node){
  const t=rand(0,Math.PI*2),radius=rand(7.0,28.0);
  node.group.position.set(Math.cos(t)*radius,0,Math.sin(t)*radius);
  node.group.rotation.y=rand(0,Math.PI*2);
}
function resetResourceNodes(){
  for(const n of resourceNodes)scene.remove(n.group);
  resourceNodes.length=0;
  for(let i=0;i<18;i++){
    const group=new THREE.Group();
    const logs=mat(0x79583b),ends=mat(0xcfaa75);
    for(let j=0;j<3;j++){
      const log=cyl(group,.14,.16,.92,logs,(j-1)*.24,.15+j*.115,.08*(j%2));
      log.rotation.z=Math.PI/2;
      cyl(group,.15,.15,.04,ends,(j-1)*.24+.47,.15+j*.115,.08*(j%2)).rotation.z=Math.PI/2;
    }
    const sign=mesh(group,new THREE.OctahedronGeometry(.21,0),new THREE.MeshBasicMaterial({color:0xe7c473}),0,.77,0);
    sign.castShadow=false;
    scene.add(group);
    const node={group,sign,amount:8+Math.floor(Math.random()*5),cooldown:0,phase:rand(0,7)};
    relocateResourceNode(node);resourceNodes.push(node);
  }
}
function updateResourceNodes(now,dt){
  for(const n of resourceNodes){
    if(n.cooldown>0){
      n.cooldown-=dt;
      if(n.cooldown<=0){relocateResourceNode(n);n.group.visible=true}
      continue;
    }
    n.sign.position.y=.77+Math.sin(now*.004+n.phase)*.14;
    if(dist2(n.group.position,hero.group.position)<2.35){
      state.wood+=n.amount;audio.play('coin',.34);
      for(let j=0;j<7;j++)particle(n.group.position.x,rand(.3,1.5),n.group.position.z,0xdfc79d);
      n.cooldown=10;n.group.visible=false;
      showToast('🌲 ნაპოვნი ხე +'+n.amount);
    }
  }
}
// Checkpoints: explicit & automatic, separate Player and Developer games.
const developerSave=location.pathname.toLowerCase().includes('developer');
const checkpointKey=developerSave?'georgia-alpha10-developer-save':'georgia-alpha10-player-save';
const alpha09CheckpointKey=developerSave?'georgia-alpha09-developer-save':'georgia-alpha09-player-save';
const previousCheckpointKey=developerSave?'georgia-alpha08-developer-save':'georgia-alpha08-player-save';
const legacyCheckpointKey=developerSave?'georgia-alpha07-developer-save':'georgia-alpha07-player-save';
let restartArmed=false,autoSaveAccumulator=0;
