function chooseDavidTarget(pos,dir,speed){
 const all=state.enemies.filter(e=>dist2(e.group.position,pos)<17);
 if(!all.length){previousAimTarget=null;return null}
 if(speed>.12){
   const facing=new THREE.Vector2(dir.x,dir.z);
   const front=all.filter(e=>{
     const to=new THREE.Vector2(e.group.position.x-pos.x,e.group.position.z-pos.z).normalize();
     return facing.dot(to)>.37;
   });
   if(!front.length)return null;
   front.sort((a,b)=>dist2(a.group.position,pos)-dist2(b.group.position,pos));
   const selected=front[0];previousAimTarget=selected;return selected;
 }
 if(previousAimTarget&&all.includes(previousAimTarget)&&
    dist2(previousAimTarget.group.position,pos)<12)return previousAimTarget;
 all.sort((a,b)=>dist2(a.group.position,pos)-dist2(b.group.position,pos));
 previousAimTarget=all[0];return previousAimTarget;
}
function shoot(from,to,dmg,color=0xffdf84,splash=0){
  // A physical, visible arrow rather than the former glowing round projectile.
  const arrow=new THREE.Group();arrow.position.set(from.x,from.y||1.2,from.z);
  cyl(arrow,.045,.045,1.10,materials.wood,0,0,0);
  cyl(arrow,.075,.04,.1,materials.gold,0,-.53,0);
  cone(arrow,.14,.29,materials.wall,0,.68,0);
  const feather=color===0x9df5af?materials.green:materials.yellow;
  cube(arrow,.24,.045,.10,feather,0,-.42,0);
  cube(arrow,.10,.045,.24,feather,0,-.42,0);
  scene.add(arrow);state.shots.push({mesh:arrow,to,dmg,speed:36,life:1.8,splash,source:color===0xfbe5a0?'hero':'other'});
  audio.play('arrow',color===0x9df5af?.27:.78);
}
function build(kind,prepaid=false){
  if(!defensePrices[kind]||!state.playing||state.dead||state.betweenWaves||state.paused)return;
  const price=defensePrices[kind],cost=price.coins;
  const slot=getBuildSlot(kind);
  if(!slot){showToast('🏰 მიუახლოვდი '+defenseNames[kind]+' სამშენებლო ადგილს');return}
  if(!prepaid&&(state.coins<cost||state.wood<price.wood)){showToast('საჭიროა 🪙 '+price.coins+' და 🌲 '+price.wood);return}
  const g=new THREE.Group();g.position.copy(slot.group.position);g.rotation.y=slot.rotation;
  if(kind==='wall'){
    // Tier 1 timber palisade; upgrades rebuild entire 3D structure.
    g.userData.wallVisual=wallGeometry(g,1);
  }else if(kind==='trap'){
    cube(g,2.5,.24,2.5,materials.wood,0,.13,0);
    cube(g,2.35,.10,2.35,materials.dark,0,.30,0);
    for(const xx of [-.86,-.29,.29,.86])for(const zz of [-.86,-.29,.29,.86])
      cone(g,.16,.63,materials.wall,xx,.63,zz);
    for(const side of [-1,1])cube(g,2.8,.18,.17,materials.gold,0,.22,side*1.2);
    const warning=mesh(g,new THREE.CircleGeometry(2.9,24),
      new THREE.MeshBasicMaterial({color:0xe7a14d,transparent:true,opacity:.07,depthWrite:false,side:THREE.DoubleSide}),0,.025,0);
    warning.rotation.x=-Math.PI/2;warning.castShadow=false;g.userData.trapPulse=warning;
  }else if(kind==='ballista'){
    const car=cube(g,2.8,.37,2.65,materials.wood,0,.47,0);
    cube(g,2.15,.17,2.55,materials.wall,0,.73,0);
    for(const side of [-1,1]){
      const wheel=cyl(g,.51,.51,.19,materials.dark,side*1.40,.51,-.45);
      wheel.rotation.z=Math.PI/2;
      cube(g,.16,1.35,.18,materials.wood,side*.78,1.55,-.43);
    }
    const head=new THREE.Group();head.position.set(0,1.58,.07);g.add(head);
    cyl(head,.14,.20,.9,materials.wood);
    const bow=new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.8,.23,.10),new THREE.Vector3(-1.22,.40,-.05),
      new THREE.Vector3(0,.51,-.11),new THREE.Vector3(1.22,.40,-.05),new THREE.Vector3(1.8,.23,.10)
    ]);
    mesh(head,new THREE.TubeGeometry(bow,30,.13,8,false),materials.wood);
    mesh(head,new THREE.TubeGeometry(new THREE.LineCurve3(
      new THREE.Vector3(-1.8,.23,.10),new THREE.Vector3(1.8,.23,.10)),1,.018,4,false),materials.gold);
    const shaft=cyl(head,.18,.18,2.45,materials.wood,0,.47,.35);shaft.rotation.x=Math.PI/2;
    const headTip=cone(head,.25,.44,materials.wall,0,.47,1.72);headTip.rotation.x=Math.PI/2;
    g.userData.ballistaHead=head;
  }else{
    cyl(g,.85,1.00,3.35,materials.wall,0,1.68,0);
    cyl(g,1.12,1.12,.34,materials.rock,0,3.42,0);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      const block=cube(g,.48,.48,.38,materials.wall,Math.cos(a)*.92,3.83,Math.sin(a)*.92);
      block.rotation.y=a;
    }
    cone(g,1.31,1.45,materials.roof,0,4.36,0);
    const archer=person(0x426e56,true);
    archer.group.scale.setScalar(.52);archer.group.position.y=3.55;
    g.add(archer.group);g.userData.archer=archer.body;
  }
  const hit=mesh(g,new THREE.BoxGeometry(kind==='wall'?4.85:kind==='trap'?3:kind==='ballista'?3.8:2.7,kind==='wall'?4.9:kind==='trap'?1:kind==='ballista'?3.6:5.6,kind==='wall'?2.5:kind==='trap'?3:kind==='ballista'?3.8:2.7),
    new THREE.MeshBasicMaterial({transparent:true,opacity:.001,depthWrite:false}),0,kind==='wall'?2.45:kind==='trap'?.5:kind==='ballista'?1.8:2.8,0);
  hit.castShadow=false;
  scene.add(g);
  const hp=kind==='wall'?200:kind==='trap'?130:kind==='ballista'?230:170;
  const building={group:g,kind,hp,maxHp:hp,cd:rand(0,.2),slot,hit,level:1};
  hit.userData.building=building;state.builds.push(building);
  if(building.kind==='tower')rebuildTower(building);else if(building.kind!=='wall')decorateBuilding(building);makeUpgradeTag(building);optimizeBuildingVisual(building);
  slot.occupied=true;slot.group.visible=false;selectedSlot=null;selectedBuild=building;selectedEconomy=null;if(!prepaid)state.coins-=cost;state.wood-=price.wood;state.totalConstruction++;
  for(let i=0;i<9;i++)particle(g.position.x,rand(.5,1.7),g.position.z,kind==='wall'?0xffdb87:0x8debd2);
  audio.play('build');showToast(defenseNames[kind]+' მზადაა!');
  ui();
}
function upgrade(){if(!state.playing||state.betweenWaves)return;const cost=60+(state.level-1)*35;if(state.coins<cost)return;state.coins-=cost;state.level++;state.damage+=7;state.maxHp+=18;state.hp=Math.min(state.maxHp,state.hp+35);state.maxFortHP+=25;state.fortHP=Math.min(state.maxFortHP,state.fortHP+55);hero.group.scale.setScalar(1.10+Math.min(state.level-1,4)*.045);audio.play('upgrade');showToast('⬆️ გმირი გაძლიერდა! დონე '+state.level);ui()}
function heal(){if(!state.playing||state.betweenWaves||state.coins<35||state.hp>=state.maxHp)return;state.coins-=35;state.hp=Math.min(state.maxHp,state.hp+30);audio.play('coin',.45);showToast('❤️ სიცოცხლე აღდგენილია');ui()}
function dash(){if(state.dashCd>0||!state.playing||state.betweenWaves)return;state.dashTime=.22;state.dashCd=3;audio.play('dash');showToast('⚡ სწრაფი მოძრაობა')}
function beginWave(){
 state.betweenWaves=false;showChapter();
 state.waveEvent=decideWaveEvent(state.wave);
 state.eventBannerTime=4.2;
 $('eventBadge').textContent=eventLabels[state.waveEvent];
 $('eventBadge').classList.remove('hidden');
 spawnVillagers();
 // Every fifth wave is a full-scale siege with flank reinforcements.
 state.siegeMode=state.wave>=5&&state.wave%5===0;
 state.supportWaves=state.siegeMode?3:state.wave>=9?2:state.wave>=3?1:0;
 state.supportStage=0;state.supportQueued=0;state.supportSpawned=0;state.supportCd=0;
 state.waveTotal=Math.round((18+state.wave*6+(state.siegeMode?14+Math.min(10,Math.floor(state.wave/5)*3):0))*1.50);
 state.waveLeft=state.waveTotal;state.spawned=0;state.spawnCd=.35;state.waveWait=0;
 audio.play('wave',.52);
 showToast(state.siegeMode?'🔥 დიდი ალყა — მოემზადე!':
   '🇬🇪 '+eraForWave(state.wave).title+' • ტალღა '+state.wave);
 ui();
}
function scheduleEnemyReinforcements(){
 if(state.supportStage>=state.supportWaves||state.waveLeft<=0)return;
 const marks=state.supportWaves===1?[.43]:
  state.supportWaves===2?[.33,.70]:[.25,.54,.82];
 if(state.spawned<Math.max(2,Math.floor(state.waveTotal*marks[state.supportStage])))return;
 state.supportStage++;
 const amount=state.siegeMode?8+Math.min(5,Math.floor(state.wave/5)):
    state.wave>=9?7:5;
 state.supportQueued+=amount;
 state.supportCd=.15;
 state.eventBannerTime=3.4;
 $('eventBadge').textContent='⚠️ მტრის დამხმარე რაზმი • +'+amount;
 $('eventBadge').classList.remove('hidden');
 showToast('⚔️ მტერს დახმარება მოუვიდა! +'+amount+' ჯარისკაცი');
 audio.play('wave',.40);
}

