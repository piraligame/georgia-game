import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { createGameAudio } from './audio.js?v=0.4';

// GEORGIA — playable 3D alpha. A separate project from PIRALI.
const $ = id => document.getElementById(id);
const audio=createGameAudio();
function renderAudioControls(){
  const m=audio.state();
  $('musicToggle').textContent=m.music?'🎵 მუსიკა':'🎵 გამორთ.';
  $('sfxToggle').textContent=m.sfx?'🔊 ეფექტები':'🔇 ეფექტები';
  $('musicToggle').setAttribute('aria-pressed',String(m.music));
  $('sfxToggle').setAttribute('aria-pressed',String(m.sfx));
  $('musicToggle').classList.toggle('audio-muted',!m.music);
  $('sfxToggle').classList.toggle('audio-muted',!m.sfx);
}

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
const patchMat=[
  new THREE.MeshBasicMaterial({color:0x98bb7d,transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide}),
  new THREE.MeshBasicMaterial({color:0x62975f,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}),
  new THREE.MeshBasicMaterial({color:0xbdaf7b,transparent:true,opacity:.09,depthWrite:false,side:THREE.DoubleSide})
];
for(let i=0;i<110;i++){
  const x=rand(-49,49),z=rand(-49,49);
  const patch=mesh(scene,new THREE.CircleGeometry(rand(.65,1.7),9),patchMat[i%3],x,-.044,z);
  patch.rotation.x=-Math.PI/2;patch.rotation.z=rand(0,6.28);
  patch.scale.set(rand(.5,1.85),rand(.65,1.55),1);
  patch.castShadow=false;
}
// Hand-shaped village lanes: smooth translucent ribbons follow cottages and gates.
const pathMaterial=new THREE.MeshBasicMaterial({color:0xe5c69d,transparent:true,opacity:.28,
 side:THREE.DoubleSide,depthWrite:false});
function drawVillagePath(points,width=1.75){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],-.038,p[1])));
 const vertices=[],uvs=[],indices=[];
 const n=58;
 for(let i=0;i<=n;i++){
   const t=i/n,pos=curve.getPoint(t),tangent=curve.getTangent(t);
   const nrm=new THREE.Vector3(-tangent.z,0,tangent.x).normalize();
   const taper=.90+.10*Math.sin(t*Math.PI*4);
   for(const side of [-1,1]){
     vertices.push(pos.x+nrm.x*width*.5*side*taper,pos.y,pos.z+nrm.z*width*.5*side*taper);
     uvs.push(side*.5+.5,t*8);
   }
   if(i<n){let k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2)}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);
 geo.computeVertexNormals();
 const road=mesh(scene,geo,pathMaterial);road.castShadow=false;
}
drawVillagePath([[-36,12],[-24,10],[-16,8],[-10,7],[-4,6],[0,5]],1.8);
drawVillagePath([[35,14],[23,9],[15,6],[9,5],[4,5]],1.9);
drawVillagePath([[5,33],[5,20],[5,14],[4,9]],1.4);
drawVillagePath([[-16,-28],[-15,-20],[-11,-12],[-8,-8]],1.4);
const ambientTrees=[];
const trunkMat=mat(0x70583b),leaf1=mat(0x36774d),leaf2=mat(0x5b9255),leaf3=mat(0x739e5d);
for(let i=0;i<90;i++){let x=rand(-47,47),z=rand(-47,47);if(Math.hypot(x,z)<11)continue;const t=new THREE.Group();t.position.set(x,0,z);cyl(t,.25,.35,2.3,trunkMat,0,1,0);cone(t,1.5,3.5,[leaf1,leaf2,leaf3][i%3],0,3.5,0);cone(t,1.15,3,[leaf1,leaf2,leaf3][(i+1)%3],0,5,0);t.scale.setScalar(rand(.7,1.25));t.userData.wind=rand(0,6.28);scene.add(t);if(i%2===0)ambientTrees.push(t)}
for(let i=0;i<75;i++){let x=rand(-35,35),z=rand(-35,35);if(Math.hypot(x,z)<6)continue;const g=new THREE.Group();g.position.set(x,0,z);if(i%3===0){sphere(g,rand(.17,.35),materials.rock,0,.1,0)}else{cone(g,.32,rand(.45,.85),i%2?leaf2:leaf3,0,.28,0)}scene.add(g)}

// Village houses, worn roads and subtle meadow flowers make the fortress a place worth defending.
const slate=mat(0x3f7398),plaster=mat(0xe6d6b0),beam=mat(0x76543a);
for(const [x,z,scale] of [[15,5,1],[14,-9,.83],[-15,5,1.08],[-14,-9,.84],[1,15,.94]]){
  const house=new THREE.Group();house.position.set(x,0,z);house.scale.setScalar(scale);
  cube(house,3.4,2.4,2.7,plaster,0,1.2,0);
  for(const xx of [-1.55,1.55])cube(house,.18,2.55,2.83,beam,xx,1.28,0);
  for(const zz of [-1.25,1.25])cube(house,3.42,.17,.16,beam,0,1.5,zz);
  // Real pitched roof: two sloping tiled wings and timber ridge, no flat overlapping slabs.
  const leftRoof=cube(house,2.37,.16,3.15,slate,-1.06,3.18,0);leftRoof.rotation.z=.49;
  const rightRoof=cube(house,2.37,.16,3.15,slate,1.06,3.18,0);rightRoof.rotation.z=-.49;
  cube(house,.28,.17,3.22,beam,0,3.70,0);
  for(const zz of [-1.40,1.40]){
    cube(house,3.25,.14,.16,beam,0,2.67,zz);
  }
  cube(house,.48,.78,.44,materials.rock,-.78,3.77,-.55);
  cone(house,.35,.40,materials.dark,-.78,4.33,-.55);
  for(const wx of [-1,1])for(const wz of [-1.12,1.12])
    cube(house,.12,1.25,.12,beam,wx*1.55,1.0,wz);
  cube(house,.68,1.36,.12,materials.wood,0,.75,1.39);
  for(const xx of [-1.0,1.0])cube(house,.55,.55,.15,materials.dark,xx,1.58,1.42);
  cyl(house,.09,.11,1.8,materials.wood,1.08,3.22,-.66);
  // Rustic yard fencing and storage crates.
  for(let j=-2;j<=2;j++){
    cube(house,.13,.83,.16,beam,j*.74,.42,-2.40);
  }
  for(const h of [.35,.65])cube(house,3.3,.10,.13,beam,0,h,-2.38);
  for(let k=0;k<2;k++){
    const crate=cube(house,.60,.52,.62,materials.wood,1.90+k*.48,.26,1.80);
    crate.rotation.y=.2*k;
  }
  scene.add(house);
}
function timberOr(material){return material}

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

const castleTorches=[];
for(const x of [-2.38,2.38]){
  const torch=new THREE.Group();torch.position.set(x,0,3.0);
  cyl(torch,.095,.14,1.8,materials.wood,0,.90,0);
  cyl(torch,.31,.19,.31,materials.dark,0,1.88,0);
  const flame=cone(torch,.22,.70,new THREE.MeshStandardMaterial({
    color:0xffbb54,emissive:0xe76c17,emissiveIntensity:.88
  }),0,2.32,0);
  cone(torch,.105,.38,materials.yellow,0,2.32,.025);
  scene.add(torch);castleTorches.push({flame,phase:x});
}
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

// The former groundRing was removed: no thick ring below the player or castle.
function person(color,hero=false){
  const g=new THREE.Group(),body=new THREE.Group();g.add(body);
  const costume=mat(color);
  const pants=mat(0x35423f),boot=mat(0x41362d);
  cyl(body,.41,.49,.95,costume,0,1.04,0);
  // Layered leather jerkin, belt and light armour improve the character's silhouette.
  cube(body,.93,.16,.6,materials.wood,0,.77,0);
  const buckle=cube(body,.24,.18,.09,materials.gold,0,.78,.36);
  if(hero){
    cube(body,.83,.17,.62,materials.gold,0,1.45,-.12);
    cube(body,.46,.24,.35,materials.dark,0,1.12,-.42);
    for(const side of [-1,1])cube(body,.27,.35,.24,materials.wood,side*.46,1.34,0);
  }
  const head=new THREE.Group();head.position.set(0,1.73,0);body.add(head);
  sphere(head,.34,materials.skin);
  sphere(head,.35,hero?materials.dark:mat(0x583e39),0,.22,-.075);
  if(hero){
    cube(head,.4,.12,.24,materials.dark,0,.17,.19);
    sphere(head,.065,materials.dark,-.12,.025,.3);
    sphere(head,.065,materials.dark,.12,.025,.3);
  }
  const legs=[];
  for(const sign of [-1,1]){
    const pivot=new THREE.Group();pivot.position.set(sign*.24,.63,0);body.add(pivot);
    cube(pivot,.26,.54,.29,pants,0,-.28,0);
    cube(pivot,.29,.23,.42,boot,0,-.57,.075);
    legs.push(pivot);
  }
  body.userData.legs=legs;body.userData.head=head;
  if(hero){
    const leftArm=new THREE.Group();leftArm.position.set(.38,1.37,.03);body.add(leftArm);
    cube(leftArm,.28,.59,.26,costume,.09,-.27,.05);
    sphere(leftArm,.17,materials.skin,.12,-.60,.10);
    const rightArm=new THREE.Group();rightArm.position.set(-.38,1.37,.02);body.add(rightArm);
    cube(rightArm,.28,.60,.26,costume,-.08,-.28,.05);
    sphere(rightArm,.17,materials.skin,-.09,-.61,.10);

    // Functional bow shape with decorated tips; draw is on local -Z axis.
    const bow=new THREE.Group();leftArm.add(bow);bow.position.set(.26,-.44,.35);
    bow.scale.set(1.22,1.24,1.1);
    const wood=mat(0x754021,.69),lacquer=mat(0xc7954b,.4),cord=mat(0xffe6ae,.71);
    const outline=new THREE.CatmullRomCurve3([
      new THREE.Vector3(.04,-.73,0),new THREE.Vector3(.21,-.60,.015),
      new THREE.Vector3(.36,-.29,.055),new THREE.Vector3(.4,0,.06),
      new THREE.Vector3(.36,.29,.055),new THREE.Vector3(.21,.60,.015),
      new THREE.Vector3(.04,.73,0)
    ]);
    mesh(bow,new THREE.TubeGeometry(outline,38,.058,8,false),wood);
    const inner=new THREE.CatmullRomCurve3([
      new THREE.Vector3(.08,-.62,-.07),new THREE.Vector3(.28,-.28,-.07),
      new THREE.Vector3(.32,0,-.06),new THREE.Vector3(.28,.28,-.07),
      new THREE.Vector3(.08,.62,-.07)
    ]);
    mesh(bow,new THREE.TubeGeometry(inner,32,.019,5,false),lacquer);
    for(const sign of [-1,1]){
      sphere(bow,.105,lacquer,.06,sign*.72,0);
      cube(bow,.14,.14,.11,materials.gold,.21,sign*.55,0);
    }
    cube(bow,.16,.26,.16,materials.dark,.38,0,.04);
    const stringA=cyl(bow,.020,.020,.75,cord),stringB=cyl(bow,.020,.020,.75,cord);
    const heldArrow=new THREE.Group();bow.add(heldArrow);
    const shaft=cyl(heldArrow,.028,.028,1.36,materials.wood,0,0,0);shaft.rotation.x=Math.PI/2;
    const arrowTip=cone(heldArrow,.12,.23,materials.wall,0,0,.75);arrowTip.rotation.x=Math.PI/2;
    for(const xx of [-.09,.09])cube(heldArrow,.06,.14,.22,materials.yellow,xx,0,-.56);
    const quiver=cyl(body,.22,.25,.8,materials.wood,-.42,1.2,-.44);quiver.rotation.z=-.25;
    for(const xx of [-.51,-.36,-.23]){cyl(body,.025,.025,.70,materials.wall,xx,1.69,-.47)}
    const cape=mesh(body,new THREE.PlaneGeometry(.85,1.18),new THREE.MeshStandardMaterial({color:0x405953,side:THREE.DoubleSide,roughness:1}),0,1.1,-.46);
    cape.rotation.x=-.12;
    body.userData.rig={bow,leftArm,rightArm,stringA,stringB,heldArrow,draw:0,shotFlash:0,phase:rand(0,6),
      recoil:0,pose:'idle',poseTime:0,aimCharge:0,cape};
  }else{
    const leftArm=new THREE.Group();leftArm.position.set(-.39,1.4,.02);body.add(leftArm);
    cube(leftArm,.26,.68,.22,costume,-.05,-.32,.04);
    const rightArm=new THREE.Group();rightArm.position.set(.39,1.4,.02);body.add(rightArm);
    cube(rightArm,.26,.68,.22,costume,.05,-.32,.04);
    const spear=cyl(rightArm,.06,.06,1.5,materials.wood,.14,-.05,.23);spear.rotation.z=-.12;
    const spearTip=cone(rightArm,.14,.35,materials.wall,.25,.80,.23);
    body.userData.leftArm=leftArm;body.userData.rightArm=rightArm;
  }
  return {group:g,body};
}

function alignRod(obj,a,b){
  obj.position.copy(a).add(b).multiplyScalar(.5);
  obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
  obj.scale.y=b.distanceTo(a)/.66;
}
function moveActorLegs(body,time,moving,dt,speed=1){
  const legs=body.userData.legs;
  if(!legs)return;
  const stride=moving?Math.sin(time*.014*speed)*.63:0;
  legs[0].rotation.x=THREE.MathUtils.lerp(legs[0].rotation.x,stride,Math.min(1,dt*14));
  legs[1].rotation.x=THREE.MathUtils.lerp(legs[1].rotation.x,-stride,Math.min(1,dt*14));
}
function turnActor(g,desired,dt,sharpness=13){
  const delta=Math.atan2(Math.sin(desired-g.rotation.y),Math.cos(desired-g.rotation.y));
  g.rotation.y+=delta*Math.min(1,dt*sharpness);
}
function animateArcher(body,time,hasTarget,dt,moving=false,dashing=false){
  const rig=body.userData.rig;if(!rig)return;
  const isHero=body===hero.body;
  const cooldown=isHero?state.attackCd:(body.userData.attackCd??.6);
  const reload=isHero?state.shotInterval:.60;
  const canAim=hasTarget&&rig.shotFlash<.70;
  const charge=canAim?THREE.MathUtils.clamp(1-Math.max(0,cooldown)/reload,0,1):0;
  const desiredPose=dashing?'dash':rig.shotFlash>.20?'release':canAim?(charge>.35?'draw':'aim'):moving?'run':'idle';
  if(rig.pose!==desiredPose){rig.pose=desiredPose;rig.poseTime=0}else rig.poseTime+=dt;
  const smooth=Math.min(1,dt*13);
  const normalized=THREE.MathUtils.clamp(charge,0,1);
  const targetDraw=(canAim?normalized:.015);
  rig.draw=THREE.MathUtils.lerp(rig.draw,targetDraw,Math.min(1,dt*17));
  const pull=rig.draw*.67;
  const walk=moving?Math.sin(time*.016+rig.phase):0;
  const breath=Math.sin(time*.0028+rig.phase);
  moveActorLegs(body,time,moving,dt,dashing?2:1);
  const aim=hasTarget?1:0;
  // Distinct, large silhouette changes: lowered bow at idle vs extended arm in aim.
  const leftX=dashing?-.28:aim?-1.20:(moving?-.35:-.13);
  const rightX=dashing?.62:aim?-1.06-normalized*.17:(moving?-.20:-.11);
  rig.leftArm.rotation.x=THREE.MathUtils.lerp(rig.leftArm.rotation.x,leftX+(moving?walk*.09:breath*.025),smooth);
  rig.rightArm.rotation.x=THREE.MathUtils.lerp(rig.rightArm.rotation.x,rightX+(moving?-walk*.18:0),smooth);
  rig.leftArm.rotation.z=THREE.MathUtils.lerp(rig.leftArm.rotation.z,aim?-.17:-.38,smooth);
  rig.rightArm.rotation.z=THREE.MathUtils.lerp(rig.rightArm.rotation.z,aim?-.49:-.18,smooth);
  rig.leftArm.rotation.y=THREE.MathUtils.lerp(rig.leftArm.rotation.y,aim?.17:-.19,smooth);
  rig.rightArm.rotation.y=THREE.MathUtils.lerp(rig.rightArm.rotation.y,aim?-.26:-.05,smooth);
  rig.rightArm.position.z=THREE.MathUtils.lerp(rig.rightArm.position.z,aim?-.05-pull*.4:0,smooth);
  rig.bow.rotation.x=THREE.MathUtils.lerp(rig.bow.rotation.x,aim?.07:(moving?-.73:-1.06),smooth);
  rig.bow.rotation.z=THREE.MathUtils.lerp(rig.bow.rotation.z,aim?-.11:-.36,smooth);
  rig.bow.rotation.y=Math.sin(time*.003+rig.phase)*.035;
  const recoil=rig.shotFlash;
  rig.bow.rotation.x+=recoil*.33;
  rig.leftArm.rotation.x+=recoil*.31;
  rig.rightArm.rotation.x+=recoil*.56;
  rig.heldArrow.position.set(.04,.015,-.18-pull);
  rig.heldArrow.visible=hasTarget&&recoil<.58;
  const nock=new THREE.Vector3(-.08,0,-pull+Math.sin(recoil*25)*recoil*.07);
  alignRod(rig.stringA,new THREE.Vector3(.04,.73,0),nock);
  alignRod(rig.stringB,nock,new THREE.Vector3(.04,-.73,0));
  body.userData.head.rotation.y=Math.sin(time*.0018+rig.phase)*.10;
  body.position.y=(moving?Math.abs(walk)*.095:breath*.02);
  body.rotation.z=THREE.MathUtils.lerp(body.rotation.z,(moving?walk*.075:breath*.021)-recoil*.10,smooth);
  body.rotation.x=THREE.MathUtils.lerp(body.rotation.x,(dashing?-.34:aim?-.055:0)+recoil*.10,smooth);
  if(rig.cape){
    rig.cape.rotation.x=-.17+(moving?walk*.09:breath*.025)+(dashing?-.25:0);
  }
  rig.shotFlash=Math.max(0,recoil-dt*5.4);
}
const hero=person(0x286b6a,true);hero.group.position.set(2,0,6.5);hero.group.scale.setScalar(1.10);scene.add(hero.group);
const heroShadow=mesh(hero.group,new THREE.CircleGeometry(.69,32),new THREE.MeshBasicMaterial({
  color:0x112b23,transparent:true,opacity:.20,depthWrite:false
}),0,.012,0);heroShadow.rotation.x=-Math.PI/2;heroShadow.castShadow=false;
const heroMarker=cone(hero.group,.14,.27,new THREE.MeshBasicMaterial({
  color:0xb8f0d9,transparent:true,opacity:.72,depthTest:false
}),0,2.64,0);heroMarker.rotation.x=Math.PI;heroMarker.castShadow=false;
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
 if(!state.playing||state.betweenWaves||!selectedBuild||!state.builds.includes(selectedBuild))return;
 const b=selectedBuild;
 if(b.level>=4){showToast('⭐ ნაგებობა მაქსიმალურ დონეზეა');return}
 const cost=structureCost(b);
 if(state.coins<cost){showToast('🪙 გასაძლიერებლად საჭიროა '+cost+' მონეტა');return}
 state.coins-=cost;b.level++;
 b.maxHp+=b.kind==='wall'?155:110;b.hp=Math.min(b.maxHp,b.hp+(b.kind==='wall'?185:140));
 decorateBuilding(b);makeUpgradeTag(b);
 for(let i=0;i<12;i++)particle(b.group.position.x,rand(.6,2),b.group.position.z,0xffdc80);
 audio.play('upgrade');showToast((b.kind==='wall'?'🧱 კედელი':'🏹 კოშკი')+' — დონე '+b.level+'!');
 ui();
}
function createSlot(kind,x,z,rotation=0){
  const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
  const ghostLines=new THREE.Group();group.add(ghostLines);
  const markerMat=new THREE.MeshBasicMaterial({
    color:kind==='wall'?0xebd49f:0x96d7c1,transparent:true,opacity:.68,depthWrite:false,depthTest:true
  });
  for(const x of [-1,1])for(const z of [-1,1]){
    const hx=cube(ghostLines,.34,.022,.066,markerMat,x*.67,.052,z*.86);
    const hz=cube(ghostLines,.066,.022,.34,markerMat,x*.86,.052,z*.67);
    hx.castShadow=false;hz.castShadow=false;
  }
  const disk=mesh(group,new THREE.PlaneGeometry(.96,.96),new THREE.MeshBasicMaterial({
    color:kind==='wall'?0xffe1a6:0xa9e0c8,transparent:true,opacity:.055,side:THREE.DoubleSide,depthWrite:false
  }),0,.038,0);disk.rotation.x=-Math.PI/2;disk.castShadow=false;
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
  const slot={kind,group,ring:ghostLines,hit,rotation,occupied:false};hit.userData.slot=slot;slots.push(slot);
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
    const pulse=active?1.18:1+.025*Math.sin(time*.004+slot.group.position.z);
    slot.ring.scale.setScalar(pulse);
    for(const mark of slot.ring.children){mark.material.opacity=active?.9:(.45+.09*Math.sin(time*.002+slot.group.position.x))}
  }
}
const state={playing:false,dead:false,coins:80,hp:100,maxHp:100,fortHP:500,maxFortHP:500,
 wave:1,kills:0,level:1,damage:24,attackCd:0,shotInterval:.43,towerBonus:0,towerSpeed:0,
 spawnCd:0,waveLeft:0,spawned:0,waveTotal:0,builds:[],enemies:[],shots:[],pickups:[],particles:[],
 villagers:[],villagerGoal:1,rescued:0,lost:0,totalRescued:0,settlementTier:0,villageIncomeTimer:15,
 dashCd:0,dashTime:0,volleyCd:0,lastTime:0,waveWait:0,betweenWaves:false,uiCd:0};
let facing=new THREE.Vector3(0,0,-1),movement=new THREE.Vector2(0,0),lastToast=0;
const keys={};const joystick={x:0,y:0,pointer:null};
// The village grows from rescues instead of appearing fully built at the beginning.
const settlementObjects=[];
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
// Civilians: escort families from village houses to safety.
function spawnVillagers(){
  for(const v of state.villagers)scene.remove(v.group);
  state.villagers.length=0;
  state.rescued=0;state.lost=0;
  state.villagerGoal=Math.min(3,1+Math.floor((state.wave-1)/2));
  const houses=[[12,5],[-12,5],[4,13],[-13,-7],[14,-6]];
  for(let i=0;i<state.villagerGoal;i++){
    const [hx,hz]=houses[(state.wave+i-1)%houses.length];
    const group=new THREE.Group();
    group.position.set(hx+rand(-1.0,1.0),0,hz+rand(-1.0,1.0));
    const dress=mat([0x447f5b,0x627eaa,0x9d8256][i%3]);
    cyl(group,.27,.43,.90,dress,0,.68,0);
    sphere(group,.24,materials.skin,0,1.34,0);
    sphere(group,.28,materials.wood,0,1.56,-.065);
    for(const side of [-1,1]){
      cube(group,.15,.49,.18,dress,side*.37,.83,0);
      cube(group,.16,.40,.19,materials.dark,side*.17,.19,0);
    }
    const badge=cone(group,.19,.37,materials.gold,0,2.05,0);
    badge.rotation.x=Math.PI;badge.castShadow=false;
    const ring=mesh(group,new THREE.CircleGeometry(.46,12),
      new THREE.MeshBasicMaterial({color:0x9be1b0,transparent:true,opacity:.20,depthWrite:false}),0,.015,0);
    ring.rotation.x=-Math.PI/2;ring.castShadow=false;
    scene.add(group);state.villagers.push({group,phase:rand(0,6),badge,following:false,hp:38,walk:0});
  }
}
function updateVillagers(time,dt){
  for(const v of [...state.villagers]){
    const at=v.group.position;
    const distance=dist2(at,hero.group.position);
    if(!v.following&&distance<2.45){
      v.following=true;
      showToast('🏡 მცხოვრები გადარჩა • მიაცილე ციხემდე');
      audio.play('coin',.6);
    }
    let dest=null;
    if(v.following){
      const toCastle=dist2(at,castle.position);
      if(toCastle<3.75){
        scene.remove(v.group);state.villagers.splice(state.villagers.indexOf(v),1);
        state.rescued++;state.totalRescued++;state.coins+=30;growSettlement();
        state.fortHP=Math.min(state.maxFortHP,state.fortHP+24);
        showToast('🏡 ოჯახი უსაფრთხოდაა • +30 🪙');
        audio.play('upgrade',.5);
        for(let i=0;i<8;i++)particle(at.x,rand(.4,1.7),at.z,0x9fe4a5);
        ui();continue;
      }
      // The villager waits for an escort if the player gets too far away.
      if(distance<8.4)dest=castle.position;
    }
    if(dest){
      const dx=dest.x-at.x,dz=dest.z-at.z,d=Math.hypot(dx,dz);
      at.x+=dx/d*2.55*dt;at.z+=dz/d*2.55*dt;
      v.group.rotation.y=Math.atan2(dx,dz);
      v.walk+=dt*12;
      v.group.position.y=Math.abs(Math.sin(v.walk))*.055;
    }else{
      v.group.position.y=Math.sin(time*.0028+v.phase)*.04;
      v.group.rotation.y+=dt*.32;
    }
    v.badge.position.y=2.06+Math.sin(time*.005+v.phase)*.14;
    const danger=nearest(at,2.1);
    if(danger&&danger.cd<=0){
      v.hp-=12;danger.cd=.8;
      particle(at.x,1,at.z,0xffae5e);
      if(v.hp<=0){
        scene.remove(v.group);state.villagers.splice(state.villagers.indexOf(v),1);
        state.lost++;
        showToast('⚠️ სოფლის მცხოვრები დაიკარგა');
      }
    }
  }
}
function presentWaveRewards(){
  if(!state.playing||state.dead||state.betweenWaves)return;
  state.betweenWaves=true;
  for(const v of state.villagers){scene.remove(v.group);state.lost++}
  state.villagers.length=0;
  saveRecord(state.wave);
  const stipend=35+state.wave*6+state.rescued*12;
  state.coins+=stipend;
  state.fortHP=Math.min(state.maxFortHP,state.fortHP+18+state.rescued*10);
  const overlay=$('rewardOverlay');
  $('rewardTitle').textContent=state.wave+'-ე ტალღა გადალახე!';
  $('rewardEarned').textContent='🪙 ტალღის ჯილდო: +'+stipend+' • 🏡 გადარჩენილი: '+state.rescued+'/'+state.villagerGoal;
  overlay.classList.remove('hidden');
  audio.play('upgrade',.7);ui();
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
  }
  $('rewardOverlay').classList.add('hidden');
  state.betweenWaves=false;state.wave++;state.hp=Math.min(state.maxHp,state.hp+20);
  beginWave();
}
function volley(){
  if(!state.playing||state.dead||state.betweenWaves||state.volleyCd>0)return;
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
function showToast(msg){const box=$('toast');box.textContent=msg;box.classList.add('show');clearTimeout(lastToast);lastToast=setTimeout(()=>box.classList.remove('show'),1500)}
function ui(){
  $('coins').textContent=state.coins;$('wave').textContent=state.wave;$('kills').textContent=state.kills;
  $('healthtext').textContent=Math.ceil(state.hp)+' / '+state.maxHp;
  $('healthbar').style.width=Math.max(0,state.hp/state.maxHp*100)+'%';
  $('fortressHP').textContent=Math.ceil(state.fortHP)+' / '+state.maxFortHP;
  $('buildProgress').textContent=state.builds.length+'/'+slots.length;
  $('waveRemain').textContent=(state.waveLeft+state.enemies.length)+' მტერი';
  $('villagerCount').textContent=state.rescued+'/'+state.villagerGoal+' • სოფელი '+state.settlementTier+(state.lost?' • ⚠️'+state.lost:'');
  $('waveObjective').textContent=state.betweenWaves?'✅ აირჩიე შემდეგი გაძლიერება':
  state.waveLeft+state.enemies.length===0?'✅ ტალღა მოგერიებულია':'🛡️ შეაჩერე მტრის ნაკადი';
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
  $('volleyBtn').disabled=state.volleyCd>0||state.betweenWaves;
  $('volleyCd').textContent=state.volleyCd>0?Math.ceil(state.volleyCd)+'წ':'მზადაა';
}
function nearest(source,range,arr=state.enemies){let best=null,ds=range;for(const e of arr){const d=dist2(source,e.group.position);if(d<ds){best=e;ds=d}}return best}
function makeEnemy(){const boss=state.wave%4===0&&state.spawned===state.waveTotal-1;
const roll=Math.random(),hard=state.wave>=3&&roll<.12,fast=state.wave>=2&&roll>.64;
const p=person(boss?0x9d6e4f:hard?0x734773:fast?0x8b9d53:0xb94d47);
p.group.scale.setScalar(boss?1.55:hard?1.28:fast?.89:1);
if(boss||hard){
  cube(p.body,1.08,.24,.70,materials.dark,0,1.37,-.08);
  cube(p.body,.48,.42,.18,materials.rock,0,.98,.39);
}
if(!fast){
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
if(boss){cube(p.body,.85,.16,.56,materials.gold,0,1.43,-.2);showToast('👑 მტრის კაპიტანი გამოჩნდა!')}
const lanes=[Math.PI/2,Math.PI/3,Math.PI/5,Math.PI*3/4];
const lane=lanes[(Math.floor(state.spawned/7)+Math.floor(state.wave/2))%lanes.length];
const angle=lane+rand(-.17,.17),radius=rand(17.8,20.6);
p.group.position.set(Math.cos(angle)*radius,0,Math.sin(angle)*radius);scene.add(p.group);
const hp=boss?180+state.wave*13:hard?74+state.wave*9:fast?18+state.wave*5:24+state.wave*4;
state.enemies.push({group:p.group,body:p.body,hp,maxHp:hp,speed:boss?1.7:hard?1.75:fast?rand(2.9,3.4):rand(2.0,2.45)+state.wave*.08,cd:rand(0,.5),hit:0,reward:boss?65:hard?20:fast?10:8,type:boss?'captain':hard?'armored':fast?'raider':'soldier'});
state.spawned++;}
function coin(x,z,amount=8){const g=new THREE.Group();const disk=cyl(g,.3,.3,.09,materials.gold,0,.55,0);disk.rotation.z=Math.PI/2;g.position.set(x,0,z);scene.add(g);state.pickups.push({group:g,time:0,amount:Math.random()<.14?amount+5:amount})}
function hitEnemy(e,dmg){audio.play('impact',e.hp<=dmg?.54:.38);
  const impact=e.group.position;
  for(let n=0;n<3;n++)particle(impact.x+rand(-.25,.25),rand(1.0,1.7),impact.z+rand(-.25,.25),0xffc76d);
  e.hp-=dmg;e.hit=.18;if(e.hp<=0){const pos=e.group.position.clone();scene.remove(e.group);state.enemies.splice(state.enemies.indexOf(e),1);state.kills++;coin(pos.x,pos.z,e.reward);for(let i=0;i<5;i++)particle(pos.x,1,pos.z,0xffd36b);if(state.kills%25===0)showToast('⚔️ '+state.kills+' მტერი • შესანიშნავია!')}}
function particle(x,y,z,color){const p=sphere(scene,.1,new THREE.MeshBasicMaterial({color,transparent:true,opacity:1}),x,y,z);p.castShadow=false;state.particles.push({mesh:p,vx:rand(-2,2),vy:rand(1,4),vz:rand(-2,2),life:.55})}
function shoot(from,to,dmg,color=0xffdf84){
  // A physical, visible arrow rather than the former glowing round projectile.
  const arrow=new THREE.Group();arrow.position.set(from.x,from.y||1.2,from.z);
  cyl(arrow,.045,.045,1.10,materials.wood,0,0,0);
  cyl(arrow,.075,.04,.1,materials.gold,0,-.53,0);
  cone(arrow,.14,.29,materials.wall,0,.68,0);
  const feather=color===0x9df5af?materials.green:materials.yellow;
  cube(arrow,.24,.045,.10,feather,0,-.42,0);
  cube(arrow,.10,.045,.24,feather,0,-.42,0);
  scene.add(arrow);state.shots.push({mesh:arrow,to,dmg,speed:29,life:1.32});
  audio.play('arrow',color===0x9df5af?.27:.78);
}
function build(kind){
  if(!state.playing||state.dead||state.betweenWaves)return;
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
  audio.play('build');showToast(kind==='wall'?'🧱 გალავნის ნაწილი აშენდა!':'🏹 მშვილდოსნის კოშკი მზადაა!');
  ui();
}
function upgrade(){if(!state.playing||state.betweenWaves)return;const cost=60+(state.level-1)*35;if(state.coins<cost)return;state.coins-=cost;state.level++;state.damage+=7;state.maxHp+=18;state.hp=Math.min(state.maxHp,state.hp+35);state.maxFortHP+=25;state.fortHP=Math.min(state.maxFortHP,state.fortHP+55);hero.group.scale.setScalar(1.10+Math.min(state.level-1,4)*.045);audio.play('upgrade');showToast('⬆️ გმირი გაძლიერდა! დონე '+state.level);ui()}
function heal(){if(!state.playing||state.betweenWaves||state.coins<35||state.hp>=state.maxHp)return;state.coins-=35;state.hp=Math.min(state.maxHp,state.hp+30);audio.play('coin',.45);showToast('❤️ სიცოცხლე აღდგენილია');ui()}
function dash(){if(state.dashCd>0||!state.playing||state.betweenWaves)return;state.dashTime=.22;state.dashCd=3;audio.play('dash');showToast('⚡ სწრაფი მოძრაობა')}
function beginWave(){state.betweenWaves=false;spawnVillagers();state.waveTotal=12+state.wave*6;state.waveLeft=state.waveTotal;state.spawned=0;state.spawnCd=.7;state.waveWait=0;audio.play('wave',.52);showToast('🌊 ტალღა '+state.wave+(state.wave%4===0?' • კაპიტანის შეტევა!':' • მტრის ნაკადი მოდის!'));ui()}

function reset(){for(const name of ['enemies','builds','shots','pickups','particles','villagers']){for(const item of state[name])scene.remove(item.group||item.mesh);state[name].length=0}
for(const slot of slots){slot.occupied=false;slot.group.visible=true}
for(const obj of settlementObjects)scene.remove(obj);settlementObjects.length=0;
selectedSlot=null;selectedBuild=null;$('rewardOverlay').classList.add('hidden');
Object.assign(state,{playing:true,dead:false,coins:80,hp:100,maxHp:100,fortHP:500,maxFortHP:500,
 wave:1,kills:0,level:1,damage:24,attackCd:0,shotInterval:.43,towerBonus:0,towerSpeed:0,
 spawnCd:0,waveLeft:0,spawned:0,waveTotal:0,dashCd:0,dashTime:0,volleyCd:0,
 villagerGoal:1,rescued:0,lost:0,totalRescued:0,settlementTier:0,villageIncomeTimer:15,betweenWaves:false,uiCd:0,waveWait:0});
hero.group.position.set(2,0,6.5);hero.group.scale.setScalar(1.10);facing.set(0,0,-1);$('intro').classList.add('hidden');$('over').classList.add('hidden');$('guide').classList.add('hidden');$('center').style.pointerEvents='none';beginWave();ui()}
function endGame(reason='hero'){if(state.dead)return;saveRecord(Math.max(0,state.wave-1));$('rewardOverlay').classList.add('hidden');audio.play('defeat');state.dead=true;state.playing=false;$('result').textContent=(reason==='castle'?'🏰 ციხესიმაგრე დაინგრა! ':'🏹 გმირი დამარცხდა! ')+'მიაღწიე '+state.wave+'-ე ტალღამდე • დაამარცხე '+state.kills+' მტერი • ააშენე '+state.builds.length+' ნაგებობა';$('over').classList.remove('hidden');$('center').style.pointerEvents='auto'}
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.17,Math.max(0,(now-(state.lastTime||now))/1000));state.lastTime=now;
const pos=hero.group.position;
if(state.playing&&!state.betweenWaves){
let vx=(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0)+joystick.x;
let vy=(keys['s']||keys['arrowdown']?1:0)-(keys['w']||keys['arrowup']?1:0)+joystick.y;
let l=Math.hypot(vx,vy);if(l>1){vx/=l;vy/=l;l=1}
const dx=(vx+vy)*.7071068,dz=(-vx+vy)*.7071068;
if(l>.05){movement.set(dx,dz);facing.set(dx,0,dz).normalize();const speed=state.dashTime>0?14:5.4;pos.x=THREE.MathUtils.clamp(pos.x+dx*speed*dt,-43,43);pos.z=THREE.MathUtils.clamp(pos.z+dz*speed*dt,-43,43);turnActor(hero.group,Math.atan2(facing.x,facing.z),dt,11)}
else{movement.set(0,0)}
state.dashTime=Math.max(0,state.dashTime-dt);state.dashCd=Math.max(0,state.dashCd-dt);state.volleyCd=Math.max(0,state.volleyCd-dt);
state.attackCd-=dt;
const target=nearest(pos,10.5);
if(target && state.attackCd<=0){
  const aim=target.group.position.clone().sub(pos);
  turnActor(hero.group,Math.atan2(aim.x,aim.z),dt,24);
  const start=pos.clone().addScaledVector(aim.normalize(),.46);start.y=1.54;
  hero.group.updateMatrixWorld(true);
  const rig=hero.body.userData.rig;
  const bowOrigin=rig?rig.bow.localToWorld(new THREE.Vector3(.03,.06,.42)):start;
  shoot(bowOrigin,target,state.damage,0xfbe5a0);
  state.attackCd=state.shotInterval;
  if(hero.body.userData.rig){hero.body.userData.rig.draw=0;hero.body.userData.rig.shotFlash=1;}
}else{}
animateArcher(hero.body,now,!!target,dt,l>.05,state.dashTime>0);
if(state.waveLeft>0){state.spawnCd-=dt;if(state.spawnCd<=0&&state.enemies.length<38){makeEnemy();state.waveLeft--;state.spawnCd=Math.max(.23,.44-state.wave*.018)}}
else if(state.enemies.length===0){state.waveWait+=dt;
  if(state.waveWait>1.9)presentWaveRewards();
}
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
  enemy.body.position.y=Math.abs(Math.sin(now*.011+ep.x))*.075;
  moveActorLegs(enemy.body,now+ep.x*300,dist>1.25,dt,enemy.speed/2.2);
  if(enemy.body.userData.rightArm)enemy.body.userData.rightArm.rotation.x= -.22+Math.sin(now*.013+ep.z)*.16;
  if(enemy.body.userData.leftArm)enemy.body.userData.leftArm.rotation.x=.14-Math.sin(now*.013+ep.z)*.16;
  enemy.cd-=dt;enemy.hit=Math.max(0,enemy.hit-dt);
  enemy.body.scale.setScalar(enemy.hit>0?1.08:1);
  enemy.body.rotation.z=THREE.MathUtils.lerp(enemy.body.rotation.z,enemy.hit>0?.25:0,Math.min(1,dt*16));
  enemy.body.userData.head.rotation.y=Math.sin(now*.003+ep.x)*.08;
  if(dist<(targetObj?1.55:targetingCastle?4.15:1.25)&&enemy.cd<=0){
    enemy.cd=.98;
    if(targetObj){
      targetObj.hp-=10+state.wave;
      audio.play('damage',.27);for(let i=0;i<3;i++)particle(ep.x,1,ep.z,0xf4cca4);
      if(targetObj.hp<=0){
        scene.remove(targetObj.group);state.builds.splice(state.builds.indexOf(targetObj),1);
        targetObj.slot.occupied=false;targetObj.slot.group.visible=true;
        if(selectedSlot===targetObj.slot)selectedSlot=null;
        if(selectedBuild===targetObj)selectedBuild=null;
        showToast('🧱 გალავანი დაინგრა • აღადგინე');
      }
    }else if(targetingCastle){
      state.fortHP=Math.max(0,state.fortHP-(7+state.wave*.7));
      audio.play('damage',.35);for(let i=0;i<3;i++)particle(ep.x,1,ep.z,0xff684e);
      if(state.fortHP<=0)endGame('castle');
    }else if(state.dashTime<=0){
      state.hp=Math.max(0,state.hp-Math.max(3,7+state.wave*.55-state.level));
      audio.play('damage',.7);for(let i=0;i<3;i++)particle(pos.x,1,pos.z,0xff5555);
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
    animateArcher(archer,now,!!target,dt,false,false);
  }
  if(b.cd<=0&&target){
    shoot(new THREE.Vector3(b.group.position.x,4.1,b.group.position.z),target,20+b.level*11+state.level*2+state.towerBonus,0x9df5af);
    b.cd=Math.max(.25,.72-b.level*.105-state.towerSpeed);
    if(archer){archer.userData.rig.draw=0;archer.userData.rig.shotFlash=1}
  }
}
for(const shot of [...state.shots]){shot.life-=dt;const bullet=shot.mesh,enemy=shot.to;if(!state.enemies.includes(enemy)||shot.life<=0){scene.remove(bullet);state.shots.splice(state.shots.indexOf(shot),1);continue}
const tp=enemy.group.position;const dd=new THREE.Vector3(tp.x,1.05,tp.z).sub(bullet.position),len=dd.length();if(len<.45+shot.speed*dt){scene.remove(bullet);state.shots.splice(state.shots.indexOf(shot),1);hitEnemy(enemy,shot.dmg)}else {
  bullet.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dd.clone().normalize());
  bullet.position.addScaledVector(dd.normalize(),shot.speed*dt);
}}
updateVillagers(now,dt);tickSettlement(dt);
for(const item of [...state.pickups]){
 item.time+=dt;item.group.position.y=Math.sin(item.time*4)*.12;
 item.group.rotation.y+=dt*3.1;
 const gap=dist2(item.group.position,pos);
 if(gap<5.6&&gap>1.30){const step=Math.min(gap-1.25,dt*(4.5+item.time*.16));item.group.position.x+=(pos.x-item.group.position.x)/gap*step;item.group.position.z+=(pos.z-item.group.position.z)/gap*step}
 if(dist2(item.group.position,pos)<1.7){audio.play('coin',.27);state.coins+=item.amount;for(let i=0;i<4;i++)particle(item.group.position.x,.6,item.group.position.z,0xffdf7f);scene.remove(item.group);state.pickups.splice(state.pickups.indexOf(item),1)}}
for(const item of [...state.particles]){item.life-=dt;item.mesh.position.x+=item.vx*dt;item.mesh.position.y+=item.vy*dt;item.mesh.position.z+=item.vz*dt;item.vy-=9*dt;item.mesh.material.opacity=Math.max(0,item.life/.55);if(item.life<=0){scene.remove(item.mesh);state.particles.splice(state.particles.indexOf(item),1)}}
for(const b of state.builds){if(b.tag){
    const near=dist2(b.group.position,pos)<13;
    b.tag.visible=near&&selectedBuild===b; b.tag.scale.set(2.32,.86,1);
  }}
animateSlots(now);ui();
}
for(const tree of ambientTrees){
  tree.rotation.z=Math.sin(now*.0011+tree.userData.wind)*.008;
  tree.rotation.x=Math.sin(now*.0013+tree.userData.wind)*.006;
}
for(const torch of castleTorches){
  torch.flame.scale.y=.84+.18*Math.sin(now*.019+torch.phase);
  torch.flame.rotation.y+=dt*.55;
}
flag.rotation.y=-.35+Math.sin(now*.0017)*.075;
const desired=new THREE.Vector3(pos.x+19,22,pos.z+19);camera.position.lerp(desired,Math.min(1,dt*2.5));camera.lookAt(pos.x,1.05,pos.z);renderer.render(scene,camera)}
function resize(){const width=innerWidth,height=innerHeight,aspect=width/height;const view=width<760?12.2:15.5;camera.left=-view*aspect;camera.right=view*aspect;camera.top=view;camera.bottom=-view;camera.updateProjectionMatrix();renderer.setSize(width,height)}
addEventListener('resize',resize);resize();
addEventListener('keydown',ev=>{const k=ev.key.toLowerCase();keys[k]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))ev.preventDefault();if(k===' '&&!ev.repeat)dash();if(k==='q'&&!ev.repeat)build('wall');if(k==='e'&&!ev.repeat)build('tower');if(k==='r'&&!ev.repeat)upgrade();if(k==='f'&&!ev.repeat)upgradeStructure();if(k==='v'&&!ev.repeat)volley()});
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

$('musicToggle').onclick=()=>{audio.unlock();audio.toggleMusic();renderAudioControls()};
$('sfxToggle').onclick=()=>{audio.unlock();audio.toggleSfx();renderAudioControls()};
renderAudioControls();
document.addEventListener('pointerdown',()=>{if(state.playing&&!audio.state().running)audio.unlock()},{passive:true});
$('rewardBow').onclick=()=>chooseReward('bow');
$('rewardFort').onclick=()=>chooseReward('fort');
$('rewardTower').onclick=()=>chooseReward('tower');
$('volleyBtn').onclick=volley;
$('structureUpgradeBtn').onclick=upgradeStructure;
$('wallBtn').onclick=()=>build('wall');$('towerBtn').onclick=()=>build('tower');$('upgradeBtn').onclick=upgrade;$('healBtn').onclick=heal;$('dashBtn').onclick=dash;$('startBtn').onclick=()=>{audio.unlock();reset()};$('againBtn').onclick=()=>{audio.unlock();reset()};
camera.position.set(21,22,22);camera.lookAt(0,0,0);showRecord();ui();requestAnimationFrame(frame);

if(location.pathname.toLowerCase().includes('developer')){
const panel=document.createElement('aside');panel.id='devPanel';panel.innerHTML='<div class="devtitle">🛠️ DEVELOPER • GEORGIA 0.6</div><button id="devMoney">🪙 +1000</button><button id="devGod">🛡️ უკვდავება OFF</button><button id="devSkip">⏩ შემდეგი ტალღა</button><button id="devFull">❤️ შევსება</button><button id="devWalls">🏰 ყველა ნაგებობა</button>';document.body.append(panel);
$('devMoney').onclick=()=>{state.coins+=1000;ui();showToast('🪙 +1000')};
$('devGod').onclick=()=>{const enabled=state.maxHp<5000;if(enabled){state.maxHp=99999;state.hp=99999;}else{state.maxHp=100+(state.level-1)*18;state.hp=state.maxHp}$('devGod').textContent='🛡️ უკვდავება '+(enabled?'ON':'OFF');ui();};
$('devSkip').onclick=()=>{if(!state.playing)return;for(const e of state.enemies)scene.remove(e.group);state.enemies.length=0;state.waveLeft=0;state.waveWait=2.5;showToast('⏩ შემდეგი ტალღა')};
$('devFull').onclick=()=>{state.hp=state.maxHp;state.fortHP=state.maxFortHP;ui();showToast('❤️ შევსებულია')};
$('devWalls').onclick=()=>{if(!state.playing)return;state.coins+=3000;for(const slot of [...slots]){if(!slot.occupied){hero.group.position.set(slot.group.position.x,0,slot.group.position.z+2);selectedSlot=slot;build(slot.kind)}}hero.group.position.set(2,0,6.5);ui()};
}

if(location.pathname.toLowerCase().includes('developer'))window.__GEORGIA_DEV={state,hero,slots,audio,volley,chooseReward,spawnVillagers,presentWaveRewards,get selected(){return selectedBuild},upgradeStructure};
