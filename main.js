import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

// GEORGIA — playable 3D alpha. A separate project from PIRALI.
const $ = id => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8dc8bf);
scene.fog = new THREE.FogExp2(0x9ac9b7, .009);
const renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('game').appendChild(renderer.domElement);
const camera = new THREE.OrthographicCamera(-13,13,9,-9,.1,250);
const sun = new THREE.DirectionalLight(0xffedc6,2.1);
sun.position.set(-17,35,14);
sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-36;sun.shadow.camera.right=36;sun.shadow.camera.top=36;sun.shadow.camera.bottom=-36;
scene.add(sun, new THREE.HemisphereLight(0xe8f6e9,0x4c5b36,2));
const mat=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness});
const materials={grass:mat(0x7baf70),dirt:mat(0xbaa478),rock:mat(0x807f75),wall:mat(0xc1bba9),dark:mat(0x47515a),wood:mat(0x8d5f39),roof:mat(0xb3563a),gold:mat(0xffd25e,.35),red:mat(0xb54c46),enemy:mat(0xaa4945),yellow:mat(0xffd979),green:mat(0x247963),skin:mat(0xf2bf91),shadow:mat(0x253a2d)};
function mesh(parent,geo,material,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function cube(parent,w,h,d,material,x=0,y=0,z=0){return mesh(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z)}
function sphere(parent,r,material,x=0,y=0,z=0){return mesh(parent,new THREE.SphereGeometry(r,10,8),material,x,y,z)}
function cone(parent,r,h,material,x=0,y=0,z=0){return mesh(parent,new THREE.ConeGeometry(r,h,7),material,x,y,z)}
function cyl(parent,top,bottom,h,material,x=0,y=0,z=0){return mesh(parent,new THREE.CylinderGeometry(top,bottom,h,8),material,x,y,z)}
function rand(min,max){return min+Math.random()*(max-min)}
function dist2(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
const floor=mesh(scene,new THREE.PlaneGeometry(115,115),materials.grass);
floor.rotation.x=-Math.PI/2;floor.position.y=-.06;floor.castShadow=false;
const pathMat=mat(0xd0ba86);
for(let i=0;i<80;i++){const x=rand(-47,47),z=rand(-47,47);const patch=mesh(scene,new THREE.PlaneGeometry(rand(.8,3.2),rand(.8,3.2)),Math.random()<.4?pathMat:mat(Math.random()<.5?0x6ea566:0x8bbb73),x,-.045,z);patch.rotation.x=-Math.PI/2;patch.rotation.z=rand(0,6);patch.castShadow=false}
const trunkMat=mat(0x70583b),leaf1=mat(0x36774d),leaf2=mat(0x5b9255),leaf3=mat(0x739e5d);
for(let i=0;i<90;i++){let x=rand(-47,47),z=rand(-47,47);if(Math.hypot(x,z)<11)continue;const t=new THREE.Group();t.position.set(x,0,z);cyl(t,.25,.35,2.3,trunkMat,0,1,0);cone(t,1.5,3.5,[leaf1,leaf2,leaf3][i%3],0,3.5,0);cone(t,1.15,3,[leaf1,leaf2,leaf3][(i+1)%3],0,5,0);t.scale.setScalar(rand(.7,1.25));scene.add(t)}
for(let i=0;i<75;i++){let x=rand(-35,35),z=rand(-35,35);if(Math.hypot(x,z)<6)continue;const g=new THREE.Group();g.position.set(x,0,z);if(i%3===0){sphere(g,rand(.17,.35),materials.rock,0,.1,0)}else{cone(g,.32,rand(.45,.85),i%2?leaf2:leaf3,0,.28,0)}scene.add(g)}

// Village houses, worn roads and subtle meadow flowers make the fortress a place worth defending.
const slate=mat(0x3f7398),plaster=mat(0xe6d6b0),beam=mat(0x76543a);
for(const [x,z,scale] of [[15,5,1],[14,-9,.83],[-15,5,1.08],[-14,-9,.84],[1,15,.94]]){
  const house=new THREE.Group();house.position.set(x,0,z);house.scale.setScalar(scale);
  cube(house,3.4,2.4,2.7,plaster,0,1.2,0);
  for(const xx of [-1.55,1.55])cube(house,.18,2.55,2.83,beam,xx,1.28,0);
  for(const zz of [-1.25,1.25])cube(house,3.42,.17,.16,beam,0,1.5,zz);
  const roof=cube(house,4.05,.16,2.55,slate,0,3.13,0);roof.rotation.z=.15;
  const roof2=cube(house,4.05,.16,2.55,slate,0,3.13,0);roof2.rotation.z=-.15;
  cube(house,.68,1.36,.12,materials.wood,0,.75,1.39);
  for(const xx of [-1.0,1.0])cube(house,.55,.55,.15,materials.dark,xx,1.58,1.42);
  cyl(house,.09,.11,1.8,materials.wood,1.08,3.22,-.66);
  scene.add(house);
}
for(let i=0;i<160;i++){
  const x=rand(-46,46),z=rand(-46,46);
  if(Math.hypot(x,z)<11)continue;
  const petals=mesh(scene,new THREE.OctahedronGeometry(rand(.07,.15),0),
    [materials.gold,materials.yellow,materials.wall][i%3],x,.10,z);
  petals.castShadow=false;
}
const castle=new THREE.Group();scene.add(castle);
cyl(castle,3.25,3.65,.45,materials.rock,0,.22,0);
cube(castle,3.5,2.5,3.5,materials.wall,0,1.7,0);
for(let x of [-1.6,1.6])for(let z of [-1.6,1.6]){cyl(castle,.75,.85,3.8,materials.wall,x,2,z);cone(castle,1,1.7,materials.roof,x,4.75,z)}
cube(castle,1.25,2,.25,materials.wood,0,1.15,1.84);
for(let x=-1.3;x<=1.4;x+=.85)cube(castle,.58,.45,.65,materials.wall,x,3.13,1.65);

function makeGeorgianFlag(){
  const canvas=document.createElement('canvas');canvas.width=300;canvas.height=190;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fffefa';ctx.fillRect(0,0,300,190);
  ctx.fillStyle='#c82935';ctx.fillRect(139,0,22,190);ctx.fillRect(0,84,300,22);
  for(const [x,y] of [[74,44],[226,44],[74,147],[226,147]]){
    ctx.fillRect(x-4,y-17,8,34);ctx.fillRect(x-16,y-4,32,8);
    for(const dx of [-13,13]){ctx.fillRect(x+dx-2,y-7,4,14)}
  }
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
const flag=mesh(castle,new THREE.PlaneGeometry(1.85,1.18),new THREE.MeshBasicMaterial({map:makeGeorgianFlag(),side:THREE.DoubleSide}),0,6.1,0);
flag.rotation.y=-.35;
cyl(castle,.05,.05,4,materials.dark,0,5,0);

const groundRing=mesh(scene,new THREE.RingGeometry(5.5,5.8,64),new THREE.MeshBasicMaterial({color:0xf4d793,transparent:true,opacity:.14,side:THREE.DoubleSide}),0,.015,0);
groundRing.rotation.x=-Math.PI/2;
function person(color,hero=false){const g=new THREE.Group(),body=new THREE.Group();g.add(body);
cyl(body,.4,.49,.95,mat(color),0,.96,0);
sphere(body,.34,materials.skin,0,1.7,0);
sphere(body,.35,hero?materials.dark:mat(0x583e39),0,1.94,-.07);
cube(body,.18,.6,.18,materials.dark,-.22,.31,0);cube(body,.18,.6,.18,materials.dark,.22,.31,0);
if(!hero){cube(body,.18,.72,.19,mat(color),-.49,1.05,0);cube(body,.18,.72,.19,mat(color),.49,1.05,0);}
if(hero){
  // A low-poly archer with articulated arms, curved decorated bow, animated bowstring.
  cube(body,.67,.15,.6,materials.gold,0,1.43,-.2);
  const leftArm=new THREE.Group();leftArm.position.set(.36,1.30,.03);body.add(leftArm);
  cube(leftArm,.24,.68,.25,mat(color),.11,-.26,.10);
  sphere(leftArm,.17,materials.skin,.11,-.63,.14);
  const rightArm=new THREE.Group();rightArm.position.set(-.35,1.30,0);body.add(rightArm);
  cube(rightArm,.24,.68,.25,mat(color),-.04,-.28,.08);
  sphere(rightArm,.17,materials.skin,-.04,-.60,.16);
  const bow=new THREE.Group();leftArm.add(bow);bow.position.set(.2,-.42,.42);
  const wood=mat(0x8b5129,.66),lacquer=mat(0xc89c57,.46),cord=mat(0xece0a9,.75);
  const outline=new THREE.CatmullRomCurve3([
    new THREE.Vector3(.04,-.69,0),new THREE.Vector3(.28,-.45,0),
    new THREE.Vector3(.35,-.21,0),new THREE.Vector3(.32,0,0),
    new THREE.Vector3(.35,.21,0),new THREE.Vector3(.28,.45,0),
    new THREE.Vector3(.04,.69,0)
  ]);
  mesh(bow,new THREE.TubeGeometry(outline,32,.055,8,false),wood);
  cube(bow,.15,.28,.17,materials.dark,.34,0,0);
  for(const yy of [-.66,.66]){sphere(bow,.11,lacquer,.05,yy,0);}
  const stringA=cyl(bow,.014,.014,.66,cord),stringB=cyl(bow,.014,.014,.66,cord);
  const heldArrow=new THREE.Group();bow.add(heldArrow);
  const shaft=cyl(heldArrow,.026,.026,1.18,materials.wood,0,0,0);shaft.rotation.x=Math.PI/2;
  const head=cone(heldArrow,.09,.19,materials.wall,0,0,.65);head.rotation.x=Math.PI/2;
  for(const xx of [-.07,.07])cube(heldArrow,.07,.12,.20,materials.yellow,xx,0,-.48);
  const quiver=cyl(body,.2,.24,.75,materials.wood,-.42,1.15,-.42);quiver.rotation.z=-.22;
  for(const xx of [-.53,-.40,-.28])cyl(body,.021,.021,.65,cord,xx,1.66,-.44);
  const ornament=cube(body,.15,.45,.07,materials.gold,-.31,1.11,-.62);ornament.rotation.z=-.16;
  body.userData.rig={bow,leftArm,rightArm,stringA,stringB,heldArrow,draw:0,shotFlash:0,phase:rand(0,6),nock:new THREE.Vector3()};
}else{const spear=cyl(body,.06,.06,1.5,materials.wood,.52,.98,.23);spear.rotation.z=-.12;cone(body,.14,.35,materials.wall,.62,1.85,.23)}
return {group:g,body};}

function alignRod(obj,a,b){
  obj.position.copy(a).add(b).multiplyScalar(.5);
  obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
  obj.scale.y=b.distanceTo(a)/.66;
}
function animateArcher(body,time,hasTarget,dt){
  const rig=body.userData.rig;if(!rig)return;
  const cooldown=body===hero.body?state.attackCd:(body.userData.attackCd??.5);
  const goal=hasTarget?Math.max(0,1-Math.max(0,cooldown)/.47):.07;
  rig.draw=THREE.MathUtils.lerp(rig.draw,goal,Math.min(1,dt*(hasTarget?10:5)));
  const pull=rig.draw*.58,move=Math.sin(time*.0022+rig.phase);
  rig.leftArm.rotation.z=-.12+move*.035;
  rig.leftArm.rotation.x=-.16+Math.sin(time*.003+rig.phase)*.045;
  rig.rightArm.rotation.x=-.62+rig.draw*.55;
  rig.rightArm.rotation.z=-.33-rig.draw*.10;
  rig.bow.rotation.z=Math.sin(time*.003+rig.phase)*.032-rig.shotFlash*.11;
  rig.heldArrow.position.set(.05,.01,-.18-pull);
  rig.heldArrow.visible=hasTarget;
  alignRod(rig.stringA,new THREE.Vector3(.04,.69,0),new THREE.Vector3(-.02,0,-pull));
  alignRod(rig.stringB,new THREE.Vector3(-.02,0,-pull),new THREE.Vector3(.04,-.69,0));
  rig.shotFlash=Math.max(0,rig.shotFlash-dt*7);
}
const hero=person(0x286b6a,true);hero.group.position.set(2,0,6.5);scene.add(hero.group);
const heroShadow=mesh(hero.group,new THREE.CircleGeometry(.65,20),new THREE.MeshBasicMaterial({color:0x071918,transparent:true,opacity:.22,depthWrite:false}),0,.02,0);heroShadow.rotation.x=-Math.PI/2;heroShadow.castShadow=false;
const heroAura=mesh(hero.group,new THREE.RingGeometry(.69,.87,32),new THREE.MeshBasicMaterial({color:0xffdb8a,transparent:true,opacity:.62,depthWrite:false,depthTest:false,side:THREE.DoubleSide}),0,.047,0);
heroAura.rotation.x=-Math.PI/2;heroAura.castShadow=false;
const heroMarker=cone(hero.group,.19,.35,new THREE.MeshBasicMaterial({color:0x86e8cb,depthTest:false}),0,2.66,0);heroMarker.rotation.x=Math.PI;heroMarker.castShadow=false;
// Fortress construction: fourteen wall sections and four corner archer towers.
const slots=[];let selectedSlot=null,selectedBuild=null;

function structureCost(b){if(!b||b.level>=4)return 0;return b.kind==='wall'?([0,32,54,78][b.level]):([0,48,78,110][b.level])}
function makeUpgradeTag(b){
 const canvas=document.createElement('canvas');canvas.width=320;canvas.height=122;
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,320,122);
 ctx.fillStyle='rgba(20,41,34,.93)';ctx.strokeStyle='#f8d789';ctx.lineWidth=7;
 ctx.beginPath();ctx.roundRect(8,7,304,106,20);ctx.fill();ctx.stroke();
 ctx.fillStyle='#f1ca68';ctx.beginPath();ctx.arc(41,59,18,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#79551e';ctx.font='bold 19px Arial';ctx.textAlign='center';ctx.fillText('★',41,66);
 ctx.fillStyle='#f8f6e9';ctx.font='bold 24px Arial';ctx.textAlign='left';
 const txt=b.level>=4?'MAX LV 4':('LV '+b.level+'  ↑ '+structureCost(b));
 ctx.fillText(txt,70,67);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 if(b.tag){b.tag.material.map.dispose();b.tag.material.map=texture;b.tag.material.needsUpdate=true;}
 else{const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));spr.center.set(.5,.12);spr.scale.set(2.40,.92,1);spr.position.set(0,b.kind==='wall'?2.75:5.7,0);b.group.add(spr);b.tag=spr;}
}
function decorateBuilding(b){
 if(b.decor){b.group.remove(b.decor);}
 const decor=new THREE.Group();b.group.add(decor);b.decor=decor;
 for(let i=1;i<b.level;i++){
   if(b.kind==='wall'){
     cube(decor,2.75,.11,.98,materials.gold,0,.42+i*.18,0);
     for(const xx of [-1.06,1.06]){cube(decor,.18,.5,.18,materials.dark,xx,1.91+i*.06,.02);}
   }else{
     cyl(decor,.91,.91,.10,materials.gold,0,2.10+i*.25,0);
     for(const xx of [-.9,.9])sphere(decor,.17,materials.gold,xx,3.85+i*.05,0);
   }
 }
}
function upgradeStructure(){
 if(!state.playing||!selectedBuild||!state.builds.includes(selectedBuild))return;
 const b=selectedBuild;
 if(b.level>=4){showToast('⭐ ნაგებობა მაქსიმალურ დონეზეა');return}
 const cost=structureCost(b);
 if(state.coins<cost){showToast('🪙 გასაძლიერებლად საჭიროა '+cost+' მონეტა');return}
 state.coins-=cost;b.level++;
 b.maxHp+=b.kind==='wall'?155:110;b.hp=Math.min(b.maxHp,b.hp+(b.kind==='wall'?185:140));
 decorateBuilding(b);makeUpgradeTag(b);
 for(let i=0;i<12;i++)particle(b.group.position.x,rand(.6,2),b.group.position.z,0xffdc80);
 showToast((b.kind==='wall'?'🧱 კედელი':'🏹 კოშკი')+' — დონე '+b.level+'!');
 ui();
}
function createSlot(kind,x,z,rotation=0){
  const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
  const ring=mesh(group,new THREE.RingGeometry(.83,1.18,32),new THREE.MeshBasicMaterial({
    color:kind==='wall'?0xffda80:0x81f1db,transparent:true,opacity:.63,side:THREE.DoubleSide,depthWrite:false
  }),0,.052,0);ring.rotation.x=-Math.PI/2;ring.castShadow=false;
  const disk=mesh(group,new THREE.CircleGeometry(.79,32),new THREE.MeshBasicMaterial({
    color:kind==='wall'?0xf1df93:0x81ead7,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false
  }),0,.045,0);disk.rotation.x=-Math.PI/2;disk.castShadow=false;
  const ghost=new THREE.Group();group.add(ghost);
  ghost.rotation.y=rotation;
  if(kind==='wall'){
    const c=cube(ghost,1.4,.20,.53,materials.wall,0,.22,0);c.castShadow=false;
    for(const xx of [-.48,0,.48]){const b=cube(ghost,.28,.24,.57,materials.wall,xx,.4,0);b.castShadow=false}
  }else{
    const c=cyl(ghost,.35,.47,.48,materials.wood,0,.27,0);c.castShadow=false;
    const cap=cone(ghost,.59,.64,materials.roof,0,.83,0);cap.castShadow=false;
  }
  const hit=mesh(group,new THREE.CylinderGeometry(1.30,1.30,.23,24),new THREE.MeshBasicMaterial({
    color:0xffffff,transparent:true,opacity:.001,depthWrite:false
  }),0,.17,0);hit.castShadow=false;
  const slot={kind,group,ring,hit,rotation,occupied:false};hit.userData.slot=slot;slots.push(slot);
}
for(const x of [-4.9,-1.65,1.65,4.9])createSlot('wall',x,-8);
for(const x of [-4.9,4.9])createSlot('wall',x,8);
for(const z of [-4.9,-1.65,1.65,4.9])createSlot('wall',-8,z,Math.PI/2);
for(const z of [-4.9,-1.65,1.65,4.9])createSlot('wall',8,z,Math.PI/2);
for(const x of [-8,8])for(const z of [-8,8])createSlot('tower',x,z);
const slotRaycaster=new THREE.Raycaster();
renderer.domElement.addEventListener('pointerdown',event=>{
  if(!state.playing||state.dead)return;
  const rect=renderer.domElement.getBoundingClientRect();
  const ndc=new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height*2-1));
  slotRaycaster.setFromCamera(ndc,camera);
  const targets=[...slots.filter(x=>!x.occupied).map(x=>x.hit),...state.builds.filter(x=>x.hit).map(x=>x.hit)];
  const hits=slotRaycaster.intersectObjects(targets,false);
  if(hits.length){
    const obj=hits[0].object;
    if(obj.userData.building){
      const b=obj.userData.building;
      if(dist2(hero.group.position,b.group.position)>13){showToast('🚶 მიუახლოვდი ნაგებობას');return}
      selectedBuild=b;selectedSlot=null;showToast((b.kind==='wall'?'🧱 გალავანი':'🏹 კოშკი')+' • დონე '+b.level+' • 🪙 '+structureCost(b));ui();return;
    }
    const slot=obj.userData.slot;
    if(dist2(hero.group.position,slot.group.position)>12){showToast('🚶 მიუახლოვდი სამშენებლო ადგილს');return}
    selectedSlot=slot;selectedBuild=null;showToast(slot.kind==='wall'?'🧱 მონიშნულია კედლის ადგილი':'🏹 მონიშნულია მშვილდოსნის კოშკი');ui();
  }
});
function getBuildSlot(kind){
  if(selectedSlot&&selectedSlot.kind===kind&&!selectedSlot.occupied&&dist2(hero.group.position,selectedSlot.group.position)<=11)return selectedSlot;
  return slots.filter(slot=>slot.kind===kind&&!slot.occupied&&dist2(hero.group.position,slot.group.position)<=11)
    .sort((a,b)=>dist2(hero.group.position,a.group.position)-dist2(hero.group.position,b.group.position))[0]||null;
}
function animateSlots(time){
  for(const slot of slots){
    if(slot.occupied)continue;
    const active=selectedSlot===slot;
    slot.ring.material.opacity=active?.98:(.46+.13*Math.sin(time*.003+slot.group.position.x));
    slot.ring.scale.setScalar(active?1.16:1+.04*Math.sin(time*.004+slot.group.position.z));
  }
}
const state={playing:false,dead:false,coins:80,hp:100,maxHp:100,fortHP:500,maxFortHP:500,wave:1,kills:0,level:1,damage:24,attackCd:0,spawnCd:0,waveLeft:0,spawned:0,waveTotal:0,builds:[],enemies:[],shots:[],pickups:[],particles:[],dashCd:0,dashTime:0,lastTime:0,waveWait:0};
let facing=new THREE.Vector3(0,0,-1),movement=new THREE.Vector2(0,0),lastToast=0;
const keys={};const joystick={x:0,y:0,pointer:null};
function showToast(msg){const box=$('toast');box.textContent=msg;box.classList.add('show');clearTimeout(lastToast);lastToast=setTimeout(()=>box.classList.remove('show'),1500)}
function ui(){
  $('coins').textContent=state.coins;$('wave').textContent=state.wave;$('kills').textContent=state.kills;
  $('healthtext').textContent=Math.ceil(state.hp)+' / '+state.maxHp;
  $('healthbar').style.width=Math.max(0,state.hp/state.maxHp*100)+'%';
  $('fortressHP').textContent=Math.ceil(state.fortHP)+' / '+state.maxFortHP;
  $('buildProgress').textContent=state.builds.length+'/'+slots.length;
  $('waveRemain').textContent=(state.waveLeft+state.enemies.length)+' მტერი';
  $('waveObjective').textContent=state.waveLeft+state.enemies.length===0?'✅ ტალღა მოგერიებულია • +42 🪙':'🛡️ შეაჩერე მტრის ნაკადი';
  const nearestOpen=slots.filter(s=>!s.occupied).sort((a,b)=>dist2(a.group.position,hero.group.position)-dist2(b.group.position,hero.group.position))[0];
  $('spotHint').textContent=selectedSlot&&!selectedSlot.occupied
    ? (selectedSlot.kind==='wall'?'🧱 მონიშნულია კედლის ადგილი':'🏹 მონიშნულია კოშკის ადგილი')
    : nearestOpen?'მიუახლოვდი 🟡 მონიშნულ ადგილებს, ან შეეხე მათ':'🏰 ციხესიმაგრე სრულად აშენებულია!';
  const info=$('structurePanel'),button=$('structureUpgradeBtn');
  if(selectedBuild&&state.builds.includes(selectedBuild)&&dist2(hero.group.position,selectedBuild.group.position)<=14){
    info.classList.remove('hidden');
    const b=selectedBuild,cost=structureCost(b);
    $('structureLabel').textContent=(b.kind==='wall'?'🧱 კედელი':'🏹 კოშკი')+' • LV '+b.level+'/4'+' • '+Math.ceil(b.hp)+' HP';
    $('structurePrice').textContent=b.level>=4?'MAX':cost;
    button.disabled=b.level>=4||state.coins<cost;
    button.firstChild.textContent=b.level>=4?'⭐ მაქსიმუმი ':'⬆️ გააძლიერე 🪙 ';
  }else{if(selectedBuild&&!state.builds.includes(selectedBuild))selectedBuild=null;info.classList.add('hidden');}
  $('upgradePrice').textContent='🪙 '+(60+(state.level-1)*35);
  $('wallBtn').disabled=state.coins<20||!slots.some(s=>s.kind==='wall'&&!s.occupied);
  $('towerBtn').disabled=state.coins<45||!slots.some(s=>s.kind==='tower'&&!s.occupied);
  $('upgradeBtn').disabled=state.coins<60+(state.level-1)*35;
  $('healBtn').disabled=state.coins<35||state.hp>=state.maxHp;
  $('dashBtn').disabled=state.dashCd>0;
}
function nearest(source,range,arr=state.enemies){let best=null,ds=range;for(const e of arr){const d=dist2(source,e.group.position);if(d<ds){best=e;ds=d}}return best}
function makeEnemy(){const boss=state.wave%4===0&&state.spawned===state.waveTotal-1;
const roll=Math.random(),hard=state.wave>=3&&roll<.12,fast=state.wave>=2&&roll>.64;
const p=person(boss?0x9d6e4f:hard?0x734773:fast?0x8b9d53:0xb94d47);
p.group.scale.setScalar(boss?1.55:hard?1.28:fast?.89:1);
if(boss){cube(p.body,.85,.16,.56,materials.gold,0,1.43,-.2);showToast('👑 მტრის კაპიტანი გამოჩნდა!')}
const lanes=[Math.PI/2,Math.PI/3,Math.PI/5,Math.PI*3/4];
const lane=lanes[(Math.floor(state.spawned/7)+Math.floor(state.wave/2))%lanes.length];
const angle=lane+rand(-.17,.17),radius=rand(17.8,20.6);
p.group.position.set(Math.cos(angle)*radius,0,Math.sin(angle)*radius);scene.add(p.group);
const hp=boss?180+state.wave*13:hard?74+state.wave*9:fast?18+state.wave*5:24+state.wave*4;
state.enemies.push({group:p.group,body:p.body,hp,maxHp:hp,speed:boss?1.7:hard?1.75:fast?rand(2.9,3.4):rand(2.0,2.45)+state.wave*.08,cd:rand(0,.5),hit:0,reward:boss?65:hard?20:fast?10:8,type:boss?'captain':hard?'armored':fast?'raider':'soldier'});
state.spawned++;}
function coin(x,z,amount=8){const g=new THREE.Group();const disk=cyl(g,.3,.3,.09,materials.gold,0,.55,0);disk.rotation.z=Math.PI/2;g.position.set(x,0,z);scene.add(g);state.pickups.push({group:g,time:0,amount:Math.random()<.14?amount+5:amount})}
function hitEnemy(e,dmg){e.hp-=dmg;e.hit=.15;if(e.hp<=0){const pos=e.group.position.clone();scene.remove(e.group);state.enemies.splice(state.enemies.indexOf(e),1);state.kills++;coin(pos.x,pos.z,e.reward);for(let i=0;i<5;i++)particle(pos.x,1,pos.z,0xffd36b);if(state.kills%10===0)showToast('⚔️ '+state.kills+' მტერი დამარცხებულია!')}}
function particle(x,y,z,color){const p=sphere(scene,.1,new THREE.MeshBasicMaterial({color,transparent:true,opacity:1}),x,y,z);p.castShadow=false;state.particles.push({mesh:p,vx:rand(-2,2),vy:rand(1,4),vz:rand(-2,2),life:.55})}
function shoot(from,to,dmg,color=0xffdf84){
  // A physical, visible arrow rather than the former glowing round projectile.
  const arrow=new THREE.Group();arrow.position.set(from.x,from.y||1.2,from.z);
  cyl(arrow,.035,.035,.85,materials.wood,0,0,0);
  cone(arrow,.105,.24,materials.wall,0,.50,0);
  const feather=color===0x9df5af?materials.green:materials.yellow;
  cube(arrow,.18,.055,.11,feather,0,-.34,0);
  cube(arrow,.11,.055,.18,feather,0,-.34,0);
  scene.add(arrow);state.shots.push({mesh:arrow,to,dmg,speed:27,life:1.35});
}
function build(kind){
  if(!state.playing||state.dead)return;
  const cost=kind==='wall'?20:45;
  const slot=getBuildSlot(kind);
  if(!slot){showToast('🏰 მიუახლოვდი '+(kind==='wall'?'კედლის':'კოშკის')+' მონიშნულ ადგილს');return}
  if(state.coins<cost){showToast('🪙 არ გაქვს საკმარისი მონეტები');return}
  const g=new THREE.Group();g.position.copy(slot.group.position);g.rotation.y=slot.rotation;
  if(kind==='wall'){
    cube(g,3.02,1.58,.92,materials.wall,0,.79,0);
    cube(g,3.13,.23,1.07,materials.rock,0,1.65,0);
    for(const x of [-1.2,-.4,.4,1.2])cube(g,.55,.48,1.08,materials.wall,x,1.98,0);
    cube(g,3.07,.22,1.05,materials.rock,0,.12,0);
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
  const hit=mesh(g,new THREE.BoxGeometry(kind==='wall'?3.2:2.7,kind==='wall'?3:5.6,kind==='wall'?1.4:2.7),
    new THREE.MeshBasicMaterial({transparent:true,opacity:.001,depthWrite:false}),0,kind==='wall'?1.5:2.8,0);
  hit.castShadow=false;
  scene.add(g);
  const hp=kind==='wall'?200:170;
  const building={group:g,kind,hp,maxHp:hp,cd:rand(0,.2),slot,hit,level:1};
  hit.userData.building=building;state.builds.push(building);
  decorateBuilding(building);makeUpgradeTag(building);
  slot.occupied=true;slot.group.visible=false;selectedSlot=null;selectedBuild=building;state.coins-=cost;
  for(let i=0;i<9;i++)particle(g.position.x,rand(.5,1.7),g.position.z,kind==='wall'?0xffdb87:0x8debd2);
  showToast(kind==='wall'?'🧱 გალავნის ნაწილი აშენდა!':'🏹 მშვილდოსნის კოშკი მზადაა!');
  ui();
}
function upgrade(){const cost=60+(state.level-1)*35;if(state.coins<cost)return;state.coins-=cost;state.level++;state.damage+=7;state.maxHp+=18;state.hp=Math.min(state.maxHp,state.hp+35);state.maxFortHP+=25;state.fortHP=Math.min(state.maxFortHP,state.fortHP+55);hero.group.scale.setScalar(1+Math.min(state.level-1,4)*.045);showToast('⬆️ გმირი გაძლიერდა! დონე '+state.level);ui()}
function heal(){if(state.coins<35||state.hp>=state.maxHp)return;state.coins-=35;state.hp=Math.min(state.maxHp,state.hp+30);showToast('❤️ სიცოცხლე აღდგენილია');ui()}
function dash(){if(state.dashCd>0||!state.playing)return;state.dashTime=.22;state.dashCd=3;showToast('⚡ სწრაფი მოძრაობა')}
function beginWave(){state.waveTotal=12+state.wave*6;state.waveLeft=state.waveTotal;state.spawned=0;state.spawnCd=.7;state.waveWait=0;showToast('🌊 ტალღა '+state.wave+(state.wave%4===0?' • კაპიტანის შეტევა!':' • მტრის ნაკადი მოდის!'));ui()}

function reset(){for(const name of ['enemies','builds','shots','pickups','particles']){for(const item of state[name])scene.remove(item.group||item.mesh);state[name].length=0}
for(const slot of slots){slot.occupied=false;slot.group.visible=true}selectedSlot=null;selectedBuild=null;
Object.assign(state,{playing:true,dead:false,coins:80,hp:100,maxHp:100,fortHP:500,maxFortHP:500,wave:1,kills:0,level:1,damage:24,attackCd:0,spawnCd:0,waveLeft:0,spawned:0,waveTotal:0,dashCd:0,dashTime:0,waveWait:0});
hero.group.position.set(2,0,6.5);hero.group.scale.setScalar(1);facing.set(0,0,-1);$('intro').classList.add('hidden');$('over').classList.add('hidden');$('center').style.pointerEvents='none';beginWave();ui()}
function endGame(reason='hero'){state.dead=true;state.playing=false;$('result').textContent=(reason==='castle'?'🏰 ციხესიმაგრე დაინგრა! ':'🏹 გმირი დამარცხდა! ')+'მიაღწიე '+state.wave+'-ე ტალღამდე • დაამარცხე '+state.kills+' მტერი • ააშენე '+state.builds.length+' ნაგებობა';$('over').classList.remove('hidden');$('center').style.pointerEvents='auto'}
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.17,Math.max(0,(now-(state.lastTime||now))/1000));state.lastTime=now;
const pos=hero.group.position;
if(state.playing){
let vx=(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0)+joystick.x;
let vy=(keys['s']||keys['arrowdown']?1:0)-(keys['w']||keys['arrowup']?1:0)+joystick.y;
let l=Math.hypot(vx,vy);if(l>1){vx/=l;vy/=l;l=1}
const dx=(vx+vy)*.7071068,dz=(-vx+vy)*.7071068;
if(l>.05){movement.set(dx,dz);facing.set(dx,0,dz).normalize();const speed=state.dashTime>0?14:5.4;pos.x=THREE.MathUtils.clamp(pos.x+dx*speed*dt,-43,43);pos.z=THREE.MathUtils.clamp(pos.z+dz*speed*dt,-43,43);hero.group.rotation.y=Math.atan2(facing.x,facing.z);hero.body.position.y=Math.sin(now*.013)*.075}
else{movement.set(0,0);hero.body.position.y=Math.sin(now*.003)*.02}
state.dashTime=Math.max(0,state.dashTime-dt);state.dashCd=Math.max(0,state.dashCd-dt);
state.attackCd-=dt;
const target=nearest(pos,10.5);
if(target && state.attackCd<=0){
  const aim=target.group.position.clone().sub(pos);
  hero.group.rotation.y=Math.atan2(aim.x,aim.z);
  const start=pos.clone().addScaledVector(aim.normalize(),.46);start.y=1.54;
  shoot(start,target,state.damage,0xfbe5a0);
  state.attackCd=.39;hero.body.rotation.z=-.16;
  if(hero.body.userData.rig){hero.body.userData.rig.draw=0;hero.body.userData.rig.shotFlash=1;}
}else{hero.body.rotation.z*=.85}
animateArcher(hero.body,now,!!target,dt);
if(state.waveLeft>0){state.spawnCd-=dt;if(state.spawnCd<=0&&state.enemies.length<38){makeEnemy();state.waveLeft--;state.spawnCd=Math.max(.23,.44-state.wave*.018)}}
else if(state.enemies.length===0){state.waveWait+=dt;if(state.waveWait>2.4){
  state.wave++;state.coins+=42;state.hp=Math.min(state.maxHp,state.hp+26);
  state.fortHP=Math.min(state.maxFortHP,state.fortHP+25);
  beginWave();
}}
for(const enemy of [...state.enemies]){
  const ep=enemy.group.position;
  // Attack the fortress unless the defender is within striking distance.
  let targetingCastle=dist2(ep,pos)>6.5;
  let targetPos=targetingCastle?castle.position:pos,targetObj=null;
  for(const b of state.builds){
    if(dist2(ep,b.group.position)<3.0){targetPos=b.group.position;targetObj=b;targetingCastle=false;break}
  }
  const dirx=targetPos.x-ep.x,dirz=targetPos.z-ep.z,dist=Math.hypot(dirx,dirz);
  if(dist>(targetObj?1.35:targetingCastle?3.75:1.05)){
    ep.x+=dirx/Math.max(dist,.1)*enemy.speed*dt;
    ep.z+=dirz/Math.max(dist,.1)*enemy.speed*dt;
    enemy.group.rotation.y=Math.atan2(dirx,dirz);
  }
  enemy.body.position.y=Math.sin(now*.01+ep.x)*.055;enemy.cd-=dt;enemy.hit=Math.max(0,enemy.hit-dt);
  enemy.body.scale.setScalar(enemy.hit>0?1.15:1);
  if(dist<(targetObj?1.55:targetingCastle?4.15:1.25)&&enemy.cd<=0){
    enemy.cd=.98;
    if(targetObj){
      targetObj.hp-=10+state.wave;
      for(let i=0;i<3;i++)particle(ep.x,1,ep.z,0xf4cca4);
      if(targetObj.hp<=0){
        scene.remove(targetObj.group);state.builds.splice(state.builds.indexOf(targetObj),1);
        targetObj.slot.occupied=false;targetObj.slot.group.visible=true;
        if(selectedSlot===targetObj.slot)selectedSlot=null;
        if(selectedBuild===targetObj)selectedBuild=null;
        showToast('💥 გალავნის ნაწილი დაზიანდა — აღადგინე!');
      }
    }else if(targetingCastle){
      state.fortHP=Math.max(0,state.fortHP-(7+state.wave*.7));
      for(let i=0;i<3;i++)particle(ep.x,1,ep.z,0xff684e);
      if(state.fortHP<=0)endGame('castle');
    }else if(state.dashTime<=0){
      state.hp=Math.max(0,state.hp-Math.max(3,7+state.wave*.55-state.level));
      for(let i=0;i<3;i++)particle(pos.x,1,pos.z,0xff5555);
      if(state.hp<=0)endGame('hero');
    }
  }
}
for(const b of state.builds){
  if(b.kind!=='tower')continue;b.cd-=dt;
  const archer=b.group.userData.archer;
  const target=nearest(b.group.position,11.7+b.level*1.7);
  if(archer){
    archer.userData.attackCd=b.cd;
    if(target){
      const diff=target.group.position.clone().sub(b.group.position);
      archer.parent.rotation.y=Math.atan2(diff.x,diff.z)-b.group.rotation.y;
    }
    animateArcher(archer,now,!!target,dt);
  }
  if(b.cd<=0&&target){
    shoot(new THREE.Vector3(b.group.position.x,4.1,b.group.position.z),target,20+b.level*11+state.level*2,0x9df5af);
    b.cd=Math.max(.30,.72-b.level*.105);
    if(archer){archer.userData.rig.draw=0;archer.userData.rig.shotFlash=1}
  }
}
for(const shot of [...state.shots]){shot.life-=dt;const bullet=shot.mesh,enemy=shot.to;if(!state.enemies.includes(enemy)||shot.life<=0){scene.remove(bullet);state.shots.splice(state.shots.indexOf(shot),1);continue}
const tp=enemy.group.position;const dd=new THREE.Vector3(tp.x,1.05,tp.z).sub(bullet.position),len=dd.length();if(len<.45+shot.speed*dt){scene.remove(bullet);state.shots.splice(state.shots.indexOf(shot),1);hitEnemy(enemy,shot.dmg)}else {
  bullet.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dd.clone().normalize());
  bullet.position.addScaledVector(dd.normalize(),shot.speed*dt);
}}
for(const item of [...state.pickups]){
 item.time+=dt;item.group.position.y=Math.sin(item.time*4)*.12;
 item.group.rotation.y+=dt*3.1;
 const gap=dist2(item.group.position,pos);
 if(gap<5.6&&gap>1.30){const step=Math.min(gap-1.25,dt*(4.5+item.time*.16));item.group.position.x+=(pos.x-item.group.position.x)/gap*step;item.group.position.z+=(pos.z-item.group.position.z)/gap*step}
 if(dist2(item.group.position,pos)<1.7){state.coins+=item.amount;for(let i=0;i<4;i++)particle(item.group.position.x,.6,item.group.position.z,0xffdf7f);scene.remove(item.group);state.pickups.splice(state.pickups.indexOf(item),1)}}
for(const item of [...state.particles]){item.life-=dt;item.mesh.position.x+=item.vx*dt;item.mesh.position.y+=item.vy*dt;item.mesh.position.z+=item.vz*dt;item.vy-=9*dt;item.mesh.material.opacity=Math.max(0,item.life/.55);if(item.life<=0){scene.remove(item.mesh);state.particles.splice(state.particles.indexOf(item),1)}}
for(const b of state.builds){if(b.tag){
    const near=dist2(b.group.position,pos)<13;
    b.tag.visible=near; b.tag.scale.set(selectedBuild===b?2.86:2.27,selectedBuild===b?1.07:.84,1);
  }}
animateSlots(now);ui();
}
const desired=new THREE.Vector3(pos.x+19,22,pos.z+19);camera.position.lerp(desired,Math.min(1,dt*2.5));camera.lookAt(pos.x,1.05,pos.z);renderer.render(scene,camera)}
function resize(){const width=innerWidth,height=innerHeight,aspect=width/height;const view=width<760?12.2:15.5;camera.left=-view*aspect;camera.right=view*aspect;camera.top=view;camera.bottom=-view;camera.updateProjectionMatrix();renderer.setSize(width,height)}
addEventListener('resize',resize);resize();
addEventListener('keydown',ev=>{const k=ev.key.toLowerCase();keys[k]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))ev.preventDefault();if(k===' '&&!ev.repeat)dash();if(k==='q'&&!ev.repeat)build('wall');if(k==='e'&&!ev.repeat)build('tower');if(k==='r'&&!ev.repeat)upgrade();if(k==='f'&&!ev.repeat)upgradeStructure()});
addEventListener('keyup',ev=>{keys[ev.key.toLowerCase()]=false});
addEventListener('blur',()=>{for(const key in keys)keys[key]=false;joystick.x=0;joystick.y=0;setStick(0,0)});
const base=$('joystick'),stick=$('stick');
function setStick(x,y){stick.style.transform='translate('+x*32+'px,'+y*32+'px)'}
function moveStick(ev){
  if(joystick.pointer!==ev.pointerId)return;
  let x=(ev.clientX-joystick.cx)/43,y=(ev.clientY-joystick.cy)/43;
  const len=Math.max(1,Math.hypot(x,y));x/=len;y/=len;
  joystick.x=x;joystick.y=y;setStick(x,y);
}
renderer.domElement.style.touchAction='none';
renderer.domElement.addEventListener('pointerdown',ev=>{
  if(!state.playing||state.dead||ev.pointerType==='mouse'||joystick.pointer!==null)return;
  const panel=$('buildpanel').getBoundingClientRect();
  if(ev.clientY<panel.bottom+9)return; // only below upgrade/build panel
  joystick.pointer=ev.pointerId;joystick.cx=ev.clientX;joystick.cy=ev.clientY;
  base.style.left=ev.clientX+'px';base.style.top=ev.clientY+'px';
  base.classList.add('active');
  renderer.domElement.setPointerCapture(ev.pointerId);moveStick(ev);
},{passive:false});
renderer.domElement.addEventListener('pointermove',moveStick);
function releaseStick(ev){
  if(joystick.pointer!==ev.pointerId)return;
  joystick.pointer=null;joystick.x=0;joystick.y=0;
  setStick(0,0);base.classList.remove('active');
}
renderer.domElement.addEventListener('pointerup',releaseStick);
renderer.domElement.addEventListener('pointercancel',releaseStick);
window.addEventListener('pointerup',releaseStick);
window.addEventListener('pointercancel',releaseStick);

$('structureUpgradeBtn').onclick=upgradeStructure;
$('wallBtn').onclick=()=>build('wall');$('towerBtn').onclick=()=>build('tower');$('upgradeBtn').onclick=upgrade;$('healBtn').onclick=heal;$('dashBtn').onclick=dash;$('startBtn').onclick=reset;$('againBtn').onclick=reset;
camera.position.set(21,22,22);camera.lookAt(0,0,0);ui();requestAnimationFrame(frame);

if(location.pathname.toLowerCase().includes('developer')){
const panel=document.createElement('aside');panel.id='devPanel';panel.innerHTML='<div class="devtitle">🛠️ DEVELOPER • GEORGIA 0.3</div><button id="devMoney">🪙 +1000</button><button id="devGod">🛡️ უკვდავება OFF</button><button id="devSkip">⏩ შემდეგი ტალღა</button><button id="devFull">❤️ შევსება</button><button id="devWalls">🏰 ყველა ნაგებობა</button>';document.body.append(panel);
$('devMoney').onclick=()=>{state.coins+=1000;ui();showToast('🪙 +1000')};
$('devGod').onclick=()=>{const enabled=state.maxHp<5000;if(enabled){state.maxHp=99999;state.hp=99999;}else{state.maxHp=100+(state.level-1)*18;state.hp=state.maxHp}$('devGod').textContent='🛡️ უკვდავება '+(enabled?'ON':'OFF');ui();};
$('devSkip').onclick=()=>{if(!state.playing)return;for(const e of state.enemies)scene.remove(e.group);state.enemies.length=0;state.waveLeft=0;state.waveWait=2.5;showToast('⏩ შემდეგი ტალღა')};
$('devFull').onclick=()=>{state.hp=state.maxHp;state.fortHP=state.maxFortHP;ui();showToast('❤️ შევსებულია')};
$('devWalls').onclick=()=>{if(!state.playing)return;state.coins+=3000;for(const slot of [...slots]){if(!slot.occupied){hero.group.position.set(slot.group.position.x,0,slot.group.position.z+2);selectedSlot=slot;build(slot.kind)}}hero.group.position.set(2,0,6.5);ui()};
}

if(location.pathname.toLowerCase().includes('developer'))window.__GEORGIA_DEV={state,hero,slots,get selected(){return selectedBuild},upgradeStructure};
