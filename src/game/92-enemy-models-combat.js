function nearest(source,range,arr=state.enemies){let best=null,ds=range;for(const e of arr){const d=dist2(source,e.group.position);if(d<ds){best=e;ds=d}}return best}
function bossTitleSprite(name,group,y=4.45){
 const canvas=document.createElement('canvas');canvas.width=480;canvas.height=112;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#412c2bE8';ctx.strokeStyle='#efd3a0';ctx.lineWidth=5;
 ctx.beginPath();ctx.roundRect(8,9,464,92,21);ctx.fill();ctx.stroke();
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 34px sans-serif';
 ctx.fillStyle='#ffdfa2';ctx.fillText(name,240,55,444);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));
 sprite.position.set(0,y,0);sprite.scale.set(4.2,1,1);group.add(sprite);
 return sprite;
}
function makeEnemy(reinforcement=false){
const boss=!reinforcement&&state.wave%4===0&&state.spawned===state.waveTotal-1;
const era=eraForWave(state.wave),mongol=era.era==='mongol';
const superBoss=boss&&state.wave%8===0;
const shah=boss&&era.era==='safavid';
const general=boss&&!shah;
const ram=!reinforcement&&state.wave>=5&&state.wave%5===0&&state.spawned===state.waveTotal-1;
const mountedCulture=['mongol','seljuk','khwarezm','timurid'].includes(era.era);
const roll=Math.random(),cavalry=mountedCulture&&!boss&&!ram&&roll>(reinforcement?.69:.81),
 archer=state.wave>=2&&!cavalry&&roll<(reinforcement?.28:state.waveEvent==='archers'?.32:.15)&&!boss&&!ram,
  hard=!cavalry&&!archer&&!ram&&state.wave>=3&&roll<(reinforcement?.45:state.waveEvent==='siege'?.38:.17),
  fast=!cavalry&&!archer&&!ram&&state.wave>=2&&roll>.64;
const factionColors={arab:0x897a5b,seljuk:0x72693a,khwarezm:0x64567b,
 mongol:0x806047,timurid:0x547b82,ottoman:0x9e4b42,safavid:0x6d5685,russian:0x3e6d59};
const p=person(ram?0x765c4b:shah?0x753f64:boss?0x945c42:cavalry?0x8e583f:
 factionColors[era.era]||0x955e51);
p.group.scale.setScalar(ram?1.6:shah?1.63:boss?1.50:cavalry?1.12:hard?1.28:fast?.93:1);
if(cavalry||general){
 const animal=createHorse(p.group);
 p.body.position.y=1.18;p.body.scale.setScalar(cavalry?.82:.95);
 p.group.userData.horse=animal;
}
if(['mongol','khwarezm','timurid'].includes(era.era)&&!ram){
 const helm=cone(p.body,.41,.49,mat(0x594d3f),0,2.14,0);
 cube(p.body,.22,.24,.13,materials.gold,0,2.00,.31);
}else if(!ram){
 const cap=cone(p.body,shah?.53:.39,shah?.87:.58,mat(shah?0x4a284e:0xae3e4b),0,2.24,0);
 cyl(p.body,.49,.49,.11,materials.gold,0,1.94,0);
 if(shah){
   cube(p.body,1.23,.20,.72,materials.gold,0,1.44,0);
   sphere(p.body,.18,materials.gold,0,2.80,0);
 }
}
if(ram){
  // Wooden battering ram cart with bronze-reinforced beam and turning wheels.
  const wood=mat(0x73452f),dark=mat(0x49413b),steel=mat(0x9eaaa7);
  const car=new THREE.Group();p.group.add(car);p.group.userData.ramCart=car;
  const hull=cube(car,2.15,.40,3.15,wood,0,.74,0);
  for(const x of [-1.06,1.06])for(const z of [-1.18,1.18]){
    const wheel=cyl(car,.43,.43,.28,dark,x,.46,z);
    wheel.rotation.z=Math.PI/2;car.userData.wheels??=[];car.userData.wheels.push(wheel);
    cyl(car,.18,.18,.30,steel,x,.46,z).rotation.z=Math.PI/2;
  }
  const beam=cyl(car,.38,.38,3.95,wood,0,1.46,.4);beam.rotation.x=Math.PI/2;
  const head=cone(car,.52,.85,steel,0,1.46,2.40);head.rotation.x=Math.PI/2;
  cube(car,1.70,.13,3.2,steel,0,2.15,0);
  for(const sign of [-1,1])cube(car,.16,1.17,.15,wood,sign*.76,1.35,-1.0);
  const flag=mesh(car,new THREE.PlaneGeometry(.85,.85),new THREE.MeshBasicMaterial({
    color:0xb34c42,side:THREE.DoubleSide}),.50,2.58,-1.12);
  flag.rotation.y=.4;
  p.body.position.y=.95;p.body.scale.setScalar(.80);
  showToast('🪵 მტრის ტარანი მოახლოვდა! დაიცავი გალავანი!');
}
if(boss||hard){
  cube(p.body,1.08,.24,.70,materials.dark,0,1.37,-.08);
  cube(p.body,.48,.42,.18,materials.rock,0,.98,.39);
}
if(archer){
  const arm=p.body.userData.rightArm;
  for(const ch of arm.children.slice(1))arm.remove(ch);
  const curved=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-.55,.2),new THREE.Vector3(.3,0,.21),new THREE.Vector3(0,.55,.2)]);
  mesh(arm,new THREE.TubeGeometry(curved,12,.06,6,false),materials.wood);
  const cord=mesh(arm,new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0,-.55,.2),new THREE.Vector3(0,.55,.2)),1,.015,4,false),materials.wall);
}
if(era.era==='russian'&&!ram){
  cyl(p.body,.48,.42,.47,mat(0x263342),0,2.24,0);
  cube(p.body,.76,.10,.16,materials.gold,0,2.44,.36);
  cube(p.body,.78,.18,.18,mat(0xa94d48),0,1.57,.35);
  if(archer){
    const arm=p.body.userData.rightArm;
    for(const obj of [...arm.children])arm.remove(obj);
    const stock=cube(arm,.20,1.30,.15,materials.wood,.19,-.07,.35);
    stock.rotation.z=-.17;
    const barrel=cyl(arm,.07,.07,1.48,materials.wall,.31,.35,.35);
    barrel.rotation.z=-.15;
  }
}else if(era.era==='ottoman'&&!ram){
  cyl(p.body,.42,.38,.44,mat(0x9c353d),0,2.22,0);
  cube(p.body,.95,.13,.16,materials.gold,0,1.55,.35);
}
if(!fast&&!archer){
  const shield=new THREE.Group();shield.position.set(-.54,1.15,.35);p.body.add(shield);
  const plate=cyl(shield,.44,.53,.09,boss?materials.gold:materials.wood);
  plate.rotation.x=Math.PI/2;
  const face=mesh(shield,new THREE.BoxGeometry(.09,.57,.055),materials.wall,0,0,.10);
  face.castShadow=true;
  const bossLogo=cube(shield,.16,.16,.08,materials.gold,0,0,.16);
}
if(fast){
  const scarf=cone(p.body,.53,.65,materials.red,0,1.55,-.16);scarf.rotation.x=Math.PI;
}
if(boss){
 cube(p.body,1.12,.20,.64,materials.gold,0,1.43,-.2);
 const commanderTitles={arab:'⚔️ არაბთა ამირა',seljuk:'🏇 სელჩუკთა სარდალი',
 khwarezm:'⚔️ ხვარაზმელთა მეთაური',mongol:'🏇 მონღოლთა გენერალი',
 timurid:'⚔️ თემურის სარდალი',ottoman:'⚔️ ოსმალთა ფაშა',
 safavid:'👑 შაჰ-აბასი',russian:'🎖️ რუსეთის იმპერიის ოფიცერი'};
 bossTitleSprite(commanderTitles[era.era],p.group,4.6);
 showToast((commanderTitles[era.era]||'⚔️ მტრის სარდალი')+' მოახლოვდა!');
}
const lanes=[0,Math.PI/4,Math.PI/2,Math.PI*3/4,Math.PI,Math.PI*5/4,Math.PI*3/2,Math.PI*7/4];
const lane=reinforcement?
  lanes[(state.supportStage*2+Math.floor(state.supportSpawned/3)+3)%lanes.length]:
  lanes[(Math.floor(state.spawned/4)+Math.floor(state.wave/2))%lanes.length];
const angle=lane+rand(-.22,.22),
 radius=reinforcement?rand(28,35):
   rand(28+Math.min(12,state.wave*.45),35+Math.min(15,state.wave*.42));
p.group.position.set(Math.cos(angle)*radius,0,Math.sin(angle)*radius);scene.add(p.group);
// Strong enemy = 2 direct arrows; giant ram/general = 5; super-boss = 10.
// Alpha 1.08: double enemy survivability, with proportionate hero hit count.
const arrowHits=(superBoss?10:(ram||boss)?5:hard?2:1)*2;
const pressure=1+Math.min(.55,(state.wave-1)*.020)+Math.min(.17,(state.castleLevel-1)*.032);
const hp=Math.max(32,Math.ceil(state.damage*arrowHits*pressure));
const enemyBar=new THREE.Group();enemyBar.position.y=ram?4.00:(boss&&(general||shah))?4.40:cavalry?3.5:hard?2.45:2.28;p.group.add(enemyBar);
const barBack=cube(enemyBar,boss||ram?1.25:.9,.10,.06,materials.dark);
const barFront=cube(enemyBar,boss||ram?1.23:.88,.075,.07,boss||ram?materials.gold:materials.red,0,0,.03);
barBack.castShadow=false;barFront.castShadow=false;
// Distant troops keep a distinctive silhouette without hundreds of extra shadow passes.
if(mobileRenderer)p.group.traverse(node=>{if(node.isMesh)node.castShadow=false});
state.enemies.push({barFront,group:p.group,body:p.body,hp,maxHp:hp,arrowHits,reinforcement,lodColor:factionColors[era.era],
 targetObj:null,targetRefresh:rand(0,.55),speed:ram?1.45:shah?1.92:boss?2.25:cavalry?rand(3.5,4.4):archer?2.25:hard?2.10:fast?rand(3.65,4.45):rand(2.4,2.95)+Math.min(.85,state.wave*.029),cd:rand(0,.5),hit:0,reward:ram?105:boss?65:archer?14:hard?20:fast?10:8,type:ram?'ram':boss?'captain':cavalry?'cavalry':archer?'archer':hard?'armored':fast?'raider':'soldier',faction:era.era,rank:shah?'shah':general?'general':'soldier',specialCd:rand(1.4,3.2)});
if(reinforcement)state.supportSpawned++;else state.spawned++;}
function coin(x,z,amount=8){
 // Prevent thousands of uncollected drop meshes from slowing late-game waves.
 if(state.pickups.length>=(mobileRenderer?65:100)){
   state.coins+=amount;return;
 }
 const g=new THREE.Group();const disk=cyl(g,.3,.3,.09,materials.gold,0,.55,0);disk.rotation.z=Math.PI/2;g.position.set(x,0,z);scene.add(g);state.pickups.push({group:g,time:0,amount:Math.random()<.14?amount+5:amount})}
function hitEnemy(e,dmg){audio.play('impact',e.hp<=dmg?.54:.38);
  const impact=e.group.position;
  for(let n=0;n<3;n++)particle(impact.x+rand(-.25,.25),rand(1.0,1.7),impact.z+rand(-.25,.25),0xffc76d);
  e.hp-=dmg;e.hit=.18;if(e.hp<=0){const pos=e.group.position.clone();scene.remove(e.group);disposeActor(e.group);state.enemies.splice(state.enemies.indexOf(e),1);state.kills++;
  state.combo=state.comboTimer>0?Math.min(8,state.combo+1):1;state.comboTimer=2.7;
  state.score+=Math.floor(e.reward*10*(1+.16*(state.combo-1)));
  coin(pos.x,pos.z,e.reward);for(let i=0;i<5;i++)particle(pos.x,1,pos.z,0xffd36b);if(state.kills%25===0)showToast('⚔️ '+state.kills+' მტერი • შესანიშნავია!')}}
function particle(x,y,z,color){if(state.particles.length>=(mobileRenderer?64:130))return;const p=sphere(scene,.1,new THREE.MeshBasicMaterial({color,transparent:true,opacity:1}),x,y,z);p.castShadow=false;state.particles.push({mesh:p,vx:rand(-2,2),vy:rand(1,4),vz:rand(-2,2),life:.55})}
// Reclaim unique geometries and materials when large enemy waves or upgraded models vanish.
const sharedMaterials=new Set(Object.values(materials));
function disposeActor(group){
 if(!group)return;
 group.traverse(node=>{
   if(node.geometry&&!cachedGeometries.has(node.geometry))node.geometry.dispose();
   if(node.material){
     for(const material of Array.isArray(node.material)?node.material:[node.material]){
       if(sharedMaterials.has(material)||cachedMaterialSet.has(material))continue;
       if(material.map)material.map.dispose();
       material.dispose();
     }
   }
 });
}
function disposeProjectile(group){
  if(!group)return;
  scene.remove(group);
  group.traverse(node=>{if(node.geometry&&!cachedGeometries.has(node.geometry))node.geometry.dispose()});
}
// Aiming: while moving, only shoot towards enemies IN FRONT of the knight;
// while stationary, turn and target the nearest threat. Prevents arrows firing behind him.
let previousAimTarget=null,aimTargetTimer=0;
