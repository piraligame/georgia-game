function presentWaveRewards(){
  if(!state.playing||state.dead||state.betweenWaves)return;
  state.betweenWaves=true;$('eventBadge').classList.add('hidden');
  for(const v of state.villagers){scene.remove(v.group);state.lost++}
  state.villagers.length=0;
  saveRecord(state.wave);
  const stipend=35+state.wave*6+state.rescued*12;
  state.coins+=stipend;
  state.fortHP=Math.min(state.maxFortHP,state.fortHP+18+state.rescued*10);
  const overlay=$('rewardOverlay');
  $('rewardTitle').textContent=state.wave+'-ე ტალღა გადალახე!';
  $('rewardEarned').textContent='🪙 ტალღის ჯილდო: +'+stipend+' • 🏡 გადარჩენილი: '+state.rescued+'/'+state.villagerGoal;
  // Continuous siege: no full-screen interruption or choice panel.
  overlay.classList.add('hidden');
  audio.play('upgrade',.7);
  const rotations=['bow','fort','tower','army'];
  chooseReward(rotations[(state.wave-1)%rotations.length]);
  ui();
}
function chooseReward(kind){
  if(!state.betweenWaves||state.dead)return;
  if(kind==='bow'){
    state.damage+=9;state.shotInterval=Math.max(.26,state.shotInterval-.035);
    showToast('🏹 მშვილდოსანი გაძლიერდა!');
  }else if(kind==='fort'){
    state.maxFortHP+=85;state.fortHP=Math.min(state.maxFortHP,state.fortHP+185);
    for(const b of state.builds){b.maxHp+=28;b.hp=Math.min(b.maxHp,b.hp+64)}
    showToast('🏰 ციხე და გალავნები გაძლიერდა!');
  }else if(kind==='tower'){
    state.towerBonus+=10;state.towerSpeed=Math.min(.38,state.towerSpeed+.045);
    showToast('🗼 კოშკები გაძლიერდა!');
  }else if(kind==='army'){
    state.armyLevel=Math.min(5,state.armyLevel+1);
    for(const g of state.guards){g.maxHp+=18;g.hp=Math.min(g.maxHp,g.hp+25);g.damage+=5}
    showToast('🛡️ სამეფოს ჯარი გაძლიერდა!');
  }
  $('rewardOverlay').classList.add('hidden');
  state.betweenWaves=false;state.wave++;state.hp=Math.min(state.maxHp,state.hp+20);
  beginWave();updateMissions();saveCheckpoint(true);
}
function volley(){
  if(!state.playing||state.dead||state.paused||state.betweenWaves||state.volleyCd>0)return;
  const targets=state.enemies.filter(e=>dist2(hero.group.position,e.group.position)<14.5)
    .sort((a,b)=>dist2(hero.group.position,a.group.position)-dist2(hero.group.position,b.group.position));
  if(targets.length===0){showToast('🏹 სამიზნე ჯერ არ ჩანს');return}
  state.volleyCd=8;
  const face=targets[0].group.position.clone().sub(hero.group.position);
  turnActor(hero.group,Math.atan2(face.x,face.z),.3,22);
  hero.group.updateMatrixWorld(true);
  const rig=hero.body.userData.rig;
  const origin=rig?rig.bow.localToWorld(new THREE.Vector3(.03,.03,.42)):
    new THREE.Vector3(hero.group.position.x,1.5,hero.group.position.z);
  for(let i=0;i<5;i++){
    const target=targets[i%targets.length];
    const off=origin.clone();off.x+=Math.sin(i*1.3)*.10;off.z+=Math.cos(i*1.3)*.10;
    shoot(off,target,Math.round(state.damage*.7),0x9df5af);
  }
  if(rig){rig.draw=0;rig.shotFlash=1;}
  for(let i=0;i<11;i++)particle(origin.x,rand(1.0,1.9),origin.z,0xa8f1bb);
  showToast('🏹 ისრების წვიმა!');
  ui();
}
// The King's Citadel: permanent castle upgrade, only paid with actual resources.
const castleDecor=[];
function castleUpgradeCost(){return{coins:60+state.castleLevel*75,wood:4+state.castleLevel*9}}
function renderCastleLevel(){
 for(const d of castleDecor)castle.remove(d);
 castleDecor.length=0;
 for(let tier=2;tier<=state.castleLevel;tier++){
   const g=new THREE.Group();castle.add(g);castleDecor.push(g);
   const gold=materials.gold,blue=mat(0x5487a0);
   for(const x of [-1.6,1.6])for(const z of [-1.6,1.6]){
     cyl(g,.82,.85,.12,gold,x,3.2+(tier-2)*.19,z);
     if(tier>=4)cone(g,.19,.36,gold,x,5.55+(tier-3)*.12,z);
   }
   for(const z of [-1.5,1.5])cube(g,3.5,.10,.14,tier>=3?blue:gold,0,2.62+(tier-2)*.20,z);
   if(tier===5){
     cube(g,.19,.9,.16,gold,0,5.3,1.9);
     cube(g,.87,.18,.16,gold,0,5.45,1.91);
   }
 }
}
function upgradeCastle(){
 if(!state.playing||state.dead||state.betweenWaves||state.paused||state.castleLevel>=5)return;
 const cost=castleUpgradeCost();
 if(state.coins<cost.coins||state.wood<cost.wood){
   showToast('🏰 საჭიროა 🪙 '+cost.coins+' და 🌲 '+cost.wood);return
 }
 state.coins-=cost.coins;state.wood-=cost.wood;state.castleLevel++;
 state.maxFortHP+=210;state.fortHP=Math.min(state.maxFortHP,state.fortHP+290);
 for(const b of state.builds){b.maxHp+=60;b.hp=Math.min(b.maxHp,b.hp+70)}
 renderCastleLevel();
 for(let i=0;i<24;i++)particle(rand(-2.8,2.8),rand(.5,5.2),rand(-2.5,2.5),0xffd77a);
 audio.play('upgrade');showToast('🏰 ციხის დონე '+state.castleLevel+' / 5!');ui();saveCheckpoint(true);
}
// War cry buffs the allied army and temporarily staggers nearby attackers.
function battleCry(){
 if(!state.playing||state.dead||state.betweenWaves||state.paused||state.cryCd>0)return;
 state.cryCd=18;state.battleCryTime=7;
 for(const e of state.enemies){
   const d=dist2(e.group.position,hero.group.position);
   if(d<9){e.stun=Math.max(e.stun||0,1.7);e.hit=.24}
 }
 for(const g of state.guards)g.hp=Math.min(g.maxHp,g.hp+10+state.armyLevel*3);
 for(let i=0;i<25;i++){
   const angle=i*Math.PI*2/25;
   particle(hero.group.position.x+Math.cos(angle)*rand(1,3),
    rand(.12,1.0),hero.group.position.z+Math.sin(angle)*rand(1,3),0xa3fbd4);
 }
 audio.play('wave',.9);showToast('📯 სამეფოს შეძახილი! • მოკავშირეები გაძლიერდნენ');ui();
}
// Repeatable kingdom contracts, with reward progression.
const missionTemplates=[
 {key:'kills',icon:'⚔️',desc:'მოიგერიე',unit:'მტერი',base:10,step:12,reward:{coins:65,wood:0}},
 {key:'rescues',icon:'🏡',desc:'გადაარჩინე',unit:'მცხოვრები',base:2,step:2,reward:{coins:25,wood:12}},
 {key:'construction',icon:'🏰',desc:'ააშენე',unit:'ნაგებობა',base:3,step:2,reward:{coins:75,wood:6}},
 {key:'recruited',icon:'🛡️',desc:'დაიქირავე',unit:'მოკავშირე',base:2,step:2,reward:{coins:45,wood:12}}
];
function missionProgress(){
 const q=missionTemplates[state.missionStep%missionTemplates.length];
 const cycle=Math.floor(state.missionStep/missionTemplates.length);
 const target=q.base+q.step*cycle;
 let current=0;
 if(q.key==='kills')current=state.kills;
 if(q.key==='rescues')current=state.totalRescued;
 if(q.key==='construction')current=state.totalConstruction;
 if(q.key==='recruited')current=state.recruited;
 return {q,target,current};
}
function updateMissions(){
 if(!state.playing||state.dead)return;
 const m=missionProgress();
 if(m.current>=m.target&&state.missionStep<60){
   state.coins+=m.q.reward.coins;state.wood+=m.q.reward.wood;
   state.missionRewards+=m.q.reward.coins;
   state.missionStep++;
   audio.play('upgrade',.65);
   showToast('📜 დავალება შესრულდა! +'+m.q.reward.coins+' 🪙 '+(m.q.reward.wood?'+'+m.q.reward.wood+' 🌲':''));
 }
 const info=missionProgress();
 $('missionLine').textContent=info.q.icon+' '+info.q.desc+' '+info.target+' '+info.q.unit+
   ' • '+Math.min(info.current,info.target)+'/'+info.target;
 $('missionRewards').textContent='🪙 '+state.missionRewards;
}
// Firestorm: a high-impact crowd control attack with an original meteor/arrow effect.
function meteorStorm(){
 if(!state.playing||state.paused||state.dead||state.betweenWaves||state.meteorCd>0)return;
 const nearby=state.enemies.filter(e=>dist2(hero.group.position,e.group.position)<21)
    .sort((a,b)=>dist2(hero.group.position,a.group.position)-dist2(hero.group.position,b.group.position));
 if(!nearby.length){showToast('🔥 მტრები ჯერ ახლოს არ არიან');return}
 const center=nearby[0].group.position.clone();
 state.meteorCd=16;
 const radius=5.5;
 const enemies=state.enemies.filter(e=>dist2(center,e.group.position)<radius);
 for(const e of [...enemies]){
   const damage=Math.round(52+state.level*9+state.armyLevel*3);
   hitEnemy(e,damage);
   if(state.enemies.includes(e))e.stun=Math.max(e.stun||0,.65);
 }
 const effect=new THREE.Group();
 effect.position.set(center.x,.10,center.z);
 const orange=new THREE.MeshBasicMaterial({color:0xf6a656,transparent:true,opacity:.37,
   depthWrite:false,side:THREE.DoubleSide});
 const inner=new THREE.MeshBasicMaterial({color:0xfbdc7a,transparent:true,opacity:.57,
   depthWrite:false,side:THREE.DoubleSide});
 const base=mesh(effect,new THREE.CircleGeometry(radius,36),orange);base.rotation.x=-Math.PI/2;base.castShadow=false;
 const rim=mesh(effect,new THREE.RingGeometry(radius-.24,radius,40),inner);
 rim.rotation.x=-Math.PI/2;rim.castShadow=false;rim.position.y=.021;
 const darts=[];
 for(let i=0;i<16;i++){
   const a=i*2.39996,r=rand(.3,radius-.30);
   const arrow=new THREE.Group();
   arrow.position.set(Math.cos(a)*r,rand(4.5,9),Math.sin(a)*r);
   cyl(arrow,.06,.06,.78,materials.wood);
   cone(arrow,.15,.30,materials.gold,0,-.54,0).rotation.z=Math.PI;
   arrow.rotation.x=rand(-.22,.22);
   effect.add(arrow);darts.push(arrow);
 }
 scene.add(effect);state.effects.push({group:effect,time:.95,rim,base,darts});
 for(let i=0;i<22;i++)particle(center.x+rand(-radius,radius),rand(.4,2.1),
   center.z+rand(-radius,radius),i%2?0xffb055:0xffe0a4);
 audio.play('arrow',.92);audio.play('impact',.8);
 showToast('🔥 ცეცხლოვანი ისრების წვიმა • '+enemies.length+' სამიზნე!');
 ui();
}
function updateBattleEffects(dt){
 for(const effect of [...state.effects]){
   effect.time-=dt;
   const t=Math.max(0,effect.time/.95);
   effect.base.material.opacity=.27*t;
   effect.rim.material.opacity=.51*t;
   for(const d of effect.darts){
     d.position.y-=dt*13;
     if(d.position.y<.18)d.position.y=.18;
   }
   if(effect.time<=0){
     scene.remove(effect.group);
     effect.group.traverse(node=>{
       if(node.geometry)node.geometry.dispose();
       if(node.material&&!Object.values(materials).includes(node.material))node.material.dispose()
     });
     state.effects.splice(state.effects.indexOf(effect),1);
   }
 }
}
