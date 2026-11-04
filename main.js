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
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth<760?1.35:1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('game').appendChild(renderer.domElement);
const camera = new THREE.OrthographicCamera(-13,13,9,-9,.1,260);
let cameraZoom=.78; // Alpha 0.9 starts visibly farther from the battleground.
function setCameraZoom(value){
 cameraZoom=THREE.MathUtils.clamp(Number(value)||.78,.53,1.20);
 resize();
 if($('zoomLabel'))$('zoomLabel').textContent=Math.round(cameraZoom*100)+'%';
 try{localStorage.setItem('georgia-zoom-v1',String(cameraZoom))}catch{}
}
try{const z=Number(localStorage.getItem('georgia-zoom-v1'));if(z>=.53&&z<=1.20)cameraZoom=z}catch{}
const sun = new THREE.DirectionalLight(0xffedc6,2.1);
sun.position.set(-17,35,14);
sun.castShadow=true;
sun.shadow.mapSize.set(innerWidth<760?768:1024,innerWidth<760?768:1024);
sun.shadow.camera.left=-36;sun.shadow.camera.right=36;sun.shadow.camera.top=36;sun.shadow.camera.bottom=-36;
const hemiLight=new THREE.HemisphereLight(0xe8f6e9,0x4c5b36,2);
scene.add(sun,hemiLight);
const mat=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness});
const materials={grass:mat(0x7baf70),dirt:mat(0xbaa478),rock:mat(0x807f75),wall:mat(0xc1bba9),dark:mat(0x47515a),wood:mat(0x8d5f39),roof:mat(0xb3563a),gold:mat(0xffd25e,.35),red:mat(0xb54c46),enemy:mat(0xaa4945),yellow:mat(0xffd979),green:mat(0x247963),skin:mat(0xf2bf91),shadow:mat(0x253a2d)};
function mesh(parent,geo,material,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function cube(parent,w,h,d,material,x=0,y=0,z=0){return mesh(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z)}
function sphere(parent,r,material,x=0,y=0,z=0){return mesh(parent,new THREE.SphereGeometry(r,10,8),material,x,y,z)}
function cone(parent,r,h,material,x=0,y=0,z=0){return mesh(parent,new THREE.ConeGeometry(r,h,7),material,x,y,z)}
function cyl(parent,top,bottom,h,material,x=0,y=0,z=0){return mesh(parent,new THREE.CylinderGeometry(top,bottom,h,8),material,x,y,z)}
function rand(min,max){return min+Math.random()*(max-min)}
function dist2(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
const floor=mesh(scene,new THREE.PlaneGeometry(420,420),materials.grass);
floor.rotation.x=-Math.PI/2;floor.position.y=-.06;floor.castShadow=false;
const patchMat=[
  new THREE.MeshBasicMaterial({color:0x98bb7d,transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide}),
  new THREE.MeshBasicMaterial({color:0x62975f,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}),
  new THREE.MeshBasicMaterial({color:0xbdaf7b,transparent:true,opacity:.09,depthWrite:false,side:THREE.DoubleSide})
];
for(let i=0;i<260;i++){
  const x=rand(-155,155),z=rand(-155,155);
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
drawVillagePath([[-63,22],[-52,17],[-43,14],[-36,12]],1.80);
drawVillagePath([[63,-12],[51,-2],[44,7],[35,14]],1.65);
drawVillagePath([[15,61],[11,48],[5,33]],1.7);
drawVillagePath([[-9,-67],[-13,-44],[-16,-28]],1.68);
// Larger field allows continued battles and construction while zoomed in.
const ambientTrees=[];
const trunkMat=mat(0x70583b),leaf1=mat(0x36774d),leaf2=mat(0x5b9255),leaf3=mat(0x739e5d);
for(let i=0;i<130;i++){let x=rand(-94,94),z=rand(-94,94);if(Math.hypot(x,z)<11)continue;const t=new THREE.Group();t.position.set(x,0,z);cyl(t,.25,.35,2.3,trunkMat,0,1,0);cone(t,1.5,3.5,[leaf1,leaf2,leaf3][i%3],0,3.5,0);cone(t,1.15,3,[leaf1,leaf2,leaf3][(i+1)%3],0,5,0);t.scale.setScalar(rand(.7,1.25));t.userData.wind=rand(0,6.28);scene.add(t);if(i%2===0)ambientTrees.push(t)}
for(let i=0;i<115;i++){let x=rand(-74,74),z=rand(-74,74);if(Math.hypot(x,z)<6)continue;const g=new THREE.Group();g.position.set(x,0,z);if(i%3===0){sphere(g,rand(.17,.35),materials.rock,0,.1,0)}else{cone(g,.32,rand(.45,.85),i%2?leaf2:leaf3,0,.28,0)}scene.add(g)}

// Old Tbilisi's hillside silhouettes, rocky Narikala ridge and distant Mtkvari river.
// Stylized fiction set in Georgian historical landscapes, not a literal architectural reconstruction.
const oldTbilisi=new THREE.Group();scene.add(oldTbilisi);
const ochreCity=mat(0xc7ae8b),creamCity=mat(0xdfc9a7),brickCity=mat(0xa2644c),
      antiqueRoof=mat(0xac5c43),granite=mat(0x767e77),darkRock=mat(0x5b655f);
for(const [x,z,size] of [
 [-32,-16,.95],[-34,-7,.85],[-36,6,1.0],[-33,16,.75],[-30,27,.86],
 [32,-28,.83],[34,-17,1.06],[33,-5,.90],[35,9,.95],[32,22,.73],
 [-23,31,.7],[25,33,.85],[-17,-31,1.0],[8,-34,.82],[-10,33,.73]
]){
 const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(size);
 const wall=material=>cube(g,2.5,1.85,2.05,material,0,.93,0);
 wall(Math.abs(x+z)%3<1?brickCity:ochreCity);
 const rear=cube(g,2.68,.14,2.41,materials.wood,0,2.04,0);
 const left=cube(g,1.79,.12,2.4,antiqueRoof,-.72,2.41,0);left.rotation.z=.50;
 const right=cube(g,1.79,.12,2.4,antiqueRoof,.72,2.41,0);right.rotation.z=-.50;
 for(const sx of [-.76,.76]){
   cube(g,.40,.46,.10,materials.dark,sx,1.18,1.07);
   cube(g,.10,.48,.12,creamCity,sx,1.18,1.13);
 }
 cube(g,.68,1.1,.12,materials.wood,0,.56,1.08);
 oldTbilisi.add(g);
}
for(let i=0;i<42;i++){
 const side=i%2===0?-1:1,z=rand(-42,42);
 const x=side*rand(30,45);
 const rock=mesh(oldTbilisi,new THREE.DodecahedronGeometry(rand(.6,2.1),0),
   i%3===0?granite:darkRock,x,rand(-.20,.7),z);
 rock.scale.set(rand(.75,1.4),rand(.38,.85),rand(.7,1.7));
 rock.rotation.set(rand(-.20,.20),rand(0,6.28),rand(-.14,.14));
 rock.castShadow=false;
}
// Distant river ribbon, visible when defending the outer eastern approaches.
const riverGeometry=new THREE.BufferGeometry(),riverVerts=[],riverIndices=[];
for(let i=0;i<=58;i++){
 const z=-67+i*2.4,cx=45+Math.sin(z*.045)*3.3;
 riverVerts.push(cx-4.5,-.031,z,cx+4.5,-.031,z);
 if(i<58){const k=i*2;riverIndices.push(k,k+1,k+2,k+1,k+3,k+2)}
}
riverGeometry.setAttribute('position',new THREE.Float32BufferAttribute(riverVerts,3));
riverGeometry.setIndex(riverIndices);riverGeometry.computeVertexNormals();
const river=mesh(scene,riverGeometry,new THREE.MeshStandardMaterial({
 color:0x659fa8,roughness:.38,metalness:.08,transparent:true,opacity:.86,side:THREE.DoubleSide}));
river.castShadow=false;
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

for(let i=0;i<190;i++){
   const x=rand(-83,83),z=rand(-83,83);
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
  rig.rightArm.position.z=THREE.MathUtils.lerp(rig.rightArm.position.z,aim?-.07-pull*.63:0,smooth);
  rig.leftArm.position.z=THREE.MathUtils.lerp(rig.leftArm.position.z,aim?.24:-.02,smooth);
  rig.bow.rotation.x=THREE.MathUtils.lerp(rig.bow.rotation.x,aim?.07:(moving?-.73:-1.06),smooth);
  rig.bow.rotation.z=THREE.MathUtils.lerp(rig.bow.rotation.z,aim?-.11:-.36,smooth);
  rig.bow.rotation.y=THREE.MathUtils.lerp(rig.bow.rotation.y,
    (aim?.035*Math.sin(time*.005+rig.phase):-.15+Math.sin(time*.002+rig.phase)*.09),smooth);
  const recoil=rig.shotFlash;
  rig.bow.rotation.x+=recoil*.53;
  rig.leftArm.rotation.x+=recoil*.31;
  rig.rightArm.rotation.x+=recoil*.56;
  rig.heldArrow.position.set(.035,.015,-.18-pull*.94);
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
const hero=person(0x286b6a,true);hero.group.position.set(0,0,3.1);
// David from Shavsheti — fictional Georgian knight and protector of Narikala.
const davidTabard=mat(0x276a83),davidCream=mat(0xf3e6d4),davidCrimson=mat(0xaa353d);
cube(hero.body,.79,.84,.10,davidTabard,0,1.12,.51);
cube(hero.body,.12,.68,.13,davidCream,0,1.14,.61);
cube(hero.body,.54,.11,.13,davidCream,0,1.18,.62);
for(const side of [-1,1]){
  const pauldron=sphere(hero.body,.25,mat(0xc3a66f),side*.54,1.42,.015);
  pauldron.scale.set(1.22,.65,1.10);
}
const knightHelmet=cyl(hero.body.userData.head,.35,.41,.34,materials.wall,0,.29,0);
const plume=cone(hero.body.userData.head,.13,.43,davidCrimson,0,.73,-.15);
const helmGold=cube(hero.body.userData.head,.55,.09,.12,materials.gold,0,.23,.34);hero.group.scale.setScalar(1.10);scene.add(hero.group);
const heroShadow=mesh(hero.group,new THREE.CircleGeometry(.69,32),new THREE.MeshBasicMaterial({
  color:0x112b23,transparent:true,opacity:.20,depthWrite:false
}),0,.012,0);heroShadow.rotation.x=-Math.PI/2;heroShadow.castShadow=false;
const heroMarker=cone(hero.group,.14,.27,new THREE.MeshBasicMaterial({
  color:0xb8f0d9,transparent:true,opacity:.72,depthTest:false
}),0,2.64,0);heroMarker.rotation.x=Math.PI;heroMarker.castShadow=false;
// Fortress construction: fourteen wall sections and four corner archer towers.
const slots=[];let selectedSlot=null,selectedBuild=null;

const defensePrices={wall:{coins:20,wood:0},tower:{coins:45,wood:0},
 trap:{coins:28,wood:2},ballista:{coins:85,wood:10}};
const defenseNames={wall:'🧱 კედელი',tower:'🏹 კოშკი',trap:'🪤 მახე',ballista:'🎯 ბალისტა'};
function structureCost(b){
 if(!b||b.level>=4)return 0;
 const tiers={
  wall:[0,32,54,78],tower:[0,48,78,110],
  trap:[0,25,40,60],ballista:[0,68,98,135]
 };
 return tiers[b.kind]?.[b.level]||0;
}
// Narikala wall evolution: larger, completely different geometry at every tier.
// 1 Timber rampart → 2 dressed stone → 3 lime-concrete bastion → 4 giant boulder keep.
const fortressWalls={
 1:{name:'ხის გალავანი',coins:20,color:0x86613b},
 2:{name:'ქვის გალავანი',coins:32,color:0xc2aa88},
 3:{name:'ბეტონის გალავანი',coins:54,color:0xb6bec0},
 4:{name:'ლოდების გალავანი',coins:78,color:0x666f6e}
};
function wallGeometry(group,level){
 const root=new THREE.Group();group.add(root);
 const timber=mat(0x865d34),darkTimber=mat(0x563c29),stone=mat(0xc1ab8a),
  mortar=mat(0x9c9586),limestone=mat(0xb6bbba),boulder=mat(0x68716f);
 if(level===1){
   // High timber palisade with braces: visibly a WOODEN fortification.
   for(let i=0;i<11;i++){
      const x=(i-5)*.41;
      cube(root,.38,2.9,.67,i%3===0?darkTimber:timber,x,1.45,0);
      cone(root,.26,.72,materials.wood,x,3.13,0);
   }
   for(const z of [-.47,.47]){
     cube(root,4.7,.17,.16,darkTimber,0,.72,z);
     cube(root,4.7,.17,.16,darkTimber,0,2.19,z);
   }
   for(const x of [-2.0,2.0]){const brace=cube(root,.22,2.65,.18,darkTimber,x,1.21,.63);brace.rotation.z=x>0?-.24:.24}
 }else if(level===2){
   // Coarse stone courses with prominent battlements and cracked rock.
   cube(root,4.7,3.32,1.24,stone,0,1.66,0);
   cube(root,4.86,.24,1.45,mortar,0,3.27,0);
   for(let row=0;row<5;row++)for(let j=0;j<7;j++){
     const x=-2.12+j*.70+((row%2)*.32-.12);
     if(Math.abs(x)>2.33)continue;
     cube(root,.62,.49,.07,row%2?mortar:stone,x,.39+row*.61,.65);
     cube(root,.62,.49,.07,row%2?stone:mortar,x,.39+row*.61,-.65);
   }
   for(const x of [-2.13,-1.28,-.43,.43,1.28,2.13])
     cube(root,.55,.69,1.36,stone,x,3.75,0);
 }else if(level===3){
   // Solid reinforced lime-concrete tier (stylized, non-period technology).
   cube(root,4.85,4.08,1.46,limestone,0,2.05,0);
   for(const z of [-.79,.79]){
     cube(root,5.02,.22,.15,mortar,0,1.12,z);
     cube(root,5.02,.23,.15,mortar,0,3.74,z);
   }
   for(const x of [-1.95,-.65,.65,1.95]){
      cube(root,.28,4.34,1.65,mortar,x,2.15,0);
      cube(root,.52,.62,1.55,limestone,x,4.41,0);
   }
   for(const x of [-2.1,2.1])cyl(root,.42,.49,4.40,limestone,x,2.2,0);
 }else{
   // Gigantic rough grey boulders, asymmetric ridge and heavy iron supports.
   cube(root,4.70,4.42,2.06,boulder,0,2.22,0);
   const rockVariants=[mat(0x636b69),mat(0x848b83),mat(0x55605e)];
   for(let row=0;row<6;row++)for(let j=0;j<5;j++){
     const x=-2.13+j*1.06+((row%2)*.30-.15),y=.48+row*.72;
     if(Math.abs(x)>2.50)continue;
     const block=mesh(root,new THREE.DodecahedronGeometry(.55+(row+j)%3*.07,0),rockVariants[(row+j)%3],x,y,1.05);
     block.scale.set(1.12,.69,.66);block.rotation.z=((row*3+j)%5-2)*.12;
   }
   for(const x of [-2.22,-1.14,0,1.14,2.22]){
     const merlon=mesh(root,new THREE.DodecahedronGeometry(.56,0),rockVariants[(x<0?1:2)],x,4.72,0);
     merlon.scale.set(.85,1.24,1.10);
   }
   for(const x of [-2.25,2.25]){const support=cube(root,.33,4.4,.15,materials.dark,x,2.12,1.16);support.rotation.z=x<0?.04:-.04}
 }
 root.userData.wallLevel=level;
 return root;
}
function rebuildWall(b){
 if(!b||b.kind!=='wall')return;
 if(b.group.userData.wallVisual){
   const prior=b.group.userData.wallVisual;
   b.group.remove(prior);disposeActor(prior);
 }
 b.group.userData.wallVisual=wallGeometry(b.group,b.level);
}
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
 else{const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));spr.center.set(.5,.12);spr.scale.set(2.40,.92,1);spr.position.set(0,b.kind==='wall'?5.35:b.kind==='trap'?1.8:b.kind==='ballista'?4.3:5.7,0);b.group.add(spr);b.tag=spr;}
}
function decorateBuilding(b){
 if(b.decor){b.group.remove(b.decor);disposeActor(b.decor);}
 const decor=new THREE.Group();b.group.add(decor);b.decor=decor;
 for(let i=1;i<b.level;i++){
   if(b.kind==='wall'){
     cube(decor,2.75,.11,.98,materials.gold,0,.42+i*.18,0);
     for(const xx of [-1.06,1.06])cube(decor,.18,.5,.18,materials.dark,xx,1.91+i*.06,.02);
   }else if(b.kind==='trap'){
     for(const xx of [-.60,0,.60])for(const zz of [-.60,0,.60])
       cone(decor,.11,.20+i*.17,materials.gold,xx,.42+i*.04,zz);
   }else if(b.kind==='ballista'){
     cube(decor,1.45,.16,1.2,materials.gold,0,1.25+i*.06,0);
     for(const side of [-1,1])cyl(decor,.21,.21,.15,materials.gold,side*.9,1.52+i*.08,.18);
   }else{
     cyl(decor,.91,.91,.10,materials.gold,0,2.10+i*.25,0);
     for(const xx of [-.9,.9])sphere(decor,.17,materials.gold,xx,3.85+i*.05,0);
   }
 }
}
// Upgrades are a genuinely different tower architecture, not just a colored ring.
function rebuildTower(b){
 if(!b||b.kind!=='tower')return;
 // Hit proxy and label survive; prior tower model geometry is fully reclaimed.
 for(const child of [...b.group.children]){
   if(child===b.hit||child===b.tag)continue;
   b.group.remove(child);disposeActor(child);
 }
 b.group.userData.archer=null;
 b.decor=null;
 const level=b.level,height=3.05+(level-1)*.69;
 const visual=new THREE.Group();b.group.add(visual);
 const m=level===1?mat(0x8b745a):level===2?mat(0xb8b39c):
   level===3?mat(0xb6c0ba):mat(0x687b80);
 const roof=level===1?mat(0x855341):level===2?mat(0xa65c43):
   level===3?mat(0x427e89):mat(0x314e70);
 const crownMaterial=level>=4?materials.gold:materials.wall;
 cyl(visual,.92+level*.085,1.17+level*.085,height,m,0,height*.5,0);
 for(let tier=1;tier<=level;tier++){
   const y=height*(tier/level)-.13;
   cyl(visual,1.05+level*.07,1.04+level*.07,.16,crownMaterial,0,y,0);
   for(let j=0;j<4;j++){
     const a=j*Math.PI/2;
     const xx=Math.cos(a)*(1.03+level*.08),zz=Math.sin(a)*(1.03+level*.08);
     cube(visual,.38,.35,.39,level===1?materials.wood:m,xx,y+.22,zz).rotation.y=a;
   }
 }
 if(level===1){
   cone(visual,1.38,1.22,roof,0,height+.60,0);
 }else if(level===2){
   for(let i=0;i<8;i++){
     const a=i*Math.PI/4;
     cube(visual,.43,.55,.39,materials.wall,Math.cos(a)*1.15,height+.32,Math.sin(a)*1.15).rotation.y=a;
   }
   cone(visual,1.29,.87,roof,0,height+.83,0);
 }else{
   for(let i=0;i<8;i++){
     const a=i*Math.PI/4;
     const r=1.26+level*.05;
     cube(visual,.46,.68,.45,crownMaterial,Math.cos(a)*r,height+.35,Math.sin(a)*r).rotation.y=a;
   }
   cone(visual,1.40,1.25,roof,0,height+1.20,0);
   for(const side of [-1,1]){
     const guardTower=cyl(visual,.27,.30,1.05,m,side*1.17,height-.25,0);
     cone(visual,.41,.66,roof,side*1.17,height+.60,0);
   }
   const pole=cyl(visual,.035,.045,1.30,materials.wood,0,height+1.93,0);
   const flag=mesh(visual,new THREE.PlaneGeometry(.69,.52),
      new THREE.MeshBasicMaterial({color:0xc4454c,side:THREE.DoubleSide}),.36,height+2.22,0);
   flag.castShadow=false;
 }
 for(const x of [-.47,.47]){
    cube(visual,.24,.53,.16,materials.dark,x,height*.56,1.02+level*.05);
 }
 const archer=person(level>=3?0x336d89:0x426e56,true);
 archer.group.scale.setScalar(level>=3?.63:.54);
 archer.group.position.y=height-.09;
 visual.add(archer.group);
 b.group.userData.archer=archer.body;
 b.group.userData.towerVisual=visual;
 b.group.userData.towerHeight=height;
}
function upgradeStructure(prepaid=false){
 if(!state.playing||state.betweenWaves||!selectedBuild||!state.builds.includes(selectedBuild))return;
 const b=selectedBuild;
 if(b.level>=4){showToast('⭐ ნაგებობა მაქსიმალურ დონეზეა');return}
 const cost=structureCost(b);
 if(!prepaid&&state.coins<cost){showToast('🪙 გასაძლიერებლად საჭიროა '+cost+' მონეტა');return}
 if(!prepaid)state.coins-=cost;b.level++;
 b.maxHp+=b.kind==='wall'?155:b.kind==='trap'?55:130;b.hp=Math.min(b.maxHp,b.hp+(b.kind==='wall'?185:140));
 if(b.kind==='wall')rebuildWall(b);else if(b.kind==='tower')rebuildTower(b);else decorateBuilding(b);makeUpgradeTag(b);
 for(let i=0;i<12;i++)particle(b.group.position.x,rand(.6,2),b.group.position.z,0xffdc80);
 audio.play('upgrade');showToast(defenseNames[b.kind]+' — დონე '+b.level+'!');
 ui();
}
function createSlot(kind,x,z,rotation=0){
  const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
  const ghostLines=new THREE.Group();group.add(ghostLines);
  const markerMat=new THREE.MeshBasicMaterial({
    color:kind==='wall'?0xebd49f:kind==='trap'?0xf0ad76:kind==='ballista'?0xb8b0e0:0x96d7c1,transparent:true,opacity:.68,depthWrite:false,depthTest:true
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
  }else if(kind==='trap'){
    const bed=cube(ghost,1.5,.10,1.5,materials.wood,0,.11,0);bed.castShadow=false;
    for(const xx of [-.5,0,.5])for(const zz of [-.5,0,.5])cone(ghost,.10,.27,materials.wall,xx,.33,zz);
  }else if(kind==='ballista'){
    cube(ghost,1.1,.20,1.5,materials.wood,0,.38,0);
    cyl(ghost,.24,.3,1,materials.wood,0,.62,0);
    cube(ghost,1.1,.12,.12,materials.dark,0,1.0,-.1);
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
// New outer defense ring: 28 outer walls + 8 additional archer stations.
for(const x of [-12,-8,-4,0,4,8,12])for(const z of [-18,18])createSlot('wall',x,z);
for(const z of [-12,-8,-4,0,4,8,12])for(const x of [-18,18])createSlot('wall',x,z,Math.PI/2);
for(const x of [-18,18])for(const z of [-18,18])createSlot('tower',x,z);
for(const x of [-23,23])createSlot('tower',x,0);
for(const z of [-23,23])createSlot('tower',0,z);
// New advanced defense builds, no collision with existing saved slot indices.
for(const x of [-11,0,11])for(const z of [-13,13])createSlot('trap',x,z);
for(const x of [-23,23])for(const z of [-10,10])createSlot('ballista',x,z);
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
      selectedBuild=b;selectedSlot=null;selectedEconomy=null;selectedEconomyPlot=null;showToast(defenseNames[b.kind]+' • დონე '+b.level+' • 🪙 '+structureCost(b));ui();return;
    }
    const slot=obj.userData.slot;
    if(dist2(hero.group.position,slot.group.position)>12){showToast('🚶 მიუახლოვდი სამშენებლო ადგილს');return}
    selectedSlot=slot;selectedBuild=null;selectedEconomy=null;showToast('მონიშნულია: '+defenseNames[slot.kind]);ui();
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
    const distance=dist2(slot.group.position,hero.group.position);
    slot.group.visible=distance<23||active;
    if(!slot.group.visible)continue;
    const pulse=active?1.18:1+.025*Math.sin(time*.004+slot.group.position.z);
    slot.ring.scale.setScalar(pulse);
    for(const mark of slot.ring.children){mark.material.opacity=active?.9:(.45+.09*Math.sin(time*.002+slot.group.position.x))}
  }
}
// KINGDOM EXPANSION: four economy types on six flexible settlement plots.
const economyDefinitions={
 farm:{name:'🌾 ფერმა',coins:55,wood:4,interval:12,description:'თითოეული მოსავალი მონეტებს გაძლევს'},
 lumber:{name:'🪓 სახერხი',coins:60,wood:0,interval:14,description:'ხის მარაგს ამზადებს'},
 workshop:{name:'⚒️ სახელოსნო',coins:80,wood:8,interval:10,description:'შეკეთება, აღდგენა, გამაგრება'},
 barracks:{name:'🛡️ ყაზარმა',coins:110,wood:12,interval:20,description:'საკუთარი მცველების დაქირავება'},
 market:{name:'🏺 სავაჭრო',coins:75,wood:6,interval:11,description:'მონეტების შემოსავალი'},
 forge:{name:'⚒️ სამჭედლო',coins:105,wood:12,interval:15,description:'კოშკებისა და ბალისტის გაძლიერება'},
 infirmary:{name:'💚 სამკურნალო',coins:95,wood:10,interval:12,description:'გმირისა და ჯარის მკურნალობა'},
 quarry:{name:'🪨 ქვის კარიერი',coins:125,wood:10,interval:14,description:'გალავნების შეკეთება + ხე'},
 stable:{name:'🐎 საჯინიბო',coins:150,wood:16,interval:12,description:'მხედრების გახსნა და ჯარის სისწრაფე'}
};
const economyPlots=[],economyNames=['farm','lumber','workshop','barracks','market','forge','infirmary','quarry','stable'];
let selectedEconomyPlot=null,selectedEconomy=null,buildMode='defense';
const economyMarkerMat=new THREE.MeshBasicMaterial({color:0xbbe2b7,transparent:true,opacity:.58,depthWrite:false});
for(const [i,coords] of [
 [-12,0],[-12.5,11],[0,12],[11.5,0],[12,-11],[0,-12],
 [-26,-8],[-26,8],[26,-8],[26,8],[-12,-26],[12,-26],[-12,26],[12,26],
 [-27,-22],[27,-22],[-27,22],[27,22]
].entries()){
 const g=new THREE.Group();g.position.set(coords[0],0,coords[1]);scene.add(g);
 const marker=new THREE.Group();g.add(marker);
 for(const x of [-1,1])for(const z of [-1,1]){
   const a=cube(marker,.42,.04,.08,economyMarkerMat,x*1.2,.06,z*1.2);
   const b=cube(marker,.08,.04,.42,economyMarkerMat,x*1.2,.06,z*1.2);
   a.castShadow=false;b.castShadow=false;
 }
 const info=mesh(g,new THREE.CylinderGeometry(1.55,1.55,.14,24),
  new THREE.MeshBasicMaterial({color:0xa2e1b4,transparent:true,opacity:.002,depthWrite:false}),0,.15,0);
 info.castShadow=false;
 const plot={index:i,group:g,marker,info,occupied:false,building:null,preferredKind:economyNames[i%economyNames.length],deposit:0};
 info.userData.economyPlot=plot;economyPlots.push(plot);
}
function economyCost(kind){return economyDefinitions[kind]}
function economyUpgradePrice(b){return{coins:30+b.level*38,wood:2+b.level*5}}
function nearestPlot(){
 if(selectedEconomyPlot&&!selectedEconomyPlot.occupied&&dist2(hero.group.position,selectedEconomyPlot.group.position)<13)return selectedEconomyPlot;
 return economyPlots.filter(p=>!p.occupied&&dist2(p.group.position,hero.group.position)<13)
 .sort((a,b)=>dist2(a.group.position,hero.group.position)-dist2(b.group.position,hero.group.position))[0]||null;
}
function makeEconomyModel(kind,level=1){
 const g=new THREE.Group();
 const ochre=mat(0xdac99f),timber=mat(0x866143),blue=mat(0x537d9c),yellow=mat(0xd0a34e);
 const roofMat=kind==='barracks'?mat(0xa75242):blue;
 const base=mesh(g,new THREE.CylinderGeometry(1.6,1.7,.17,8),mat(0x9c9874),0,.06,0);
 if(kind==='farm'){
   cube(g,2.3,1.5,1.9,ochre,0,.8,.28);
   for(const side of [-1,1]){const b=cube(g,1.52,.15,2.28,roofMat,side*.73,1.86,.28);b.rotation.z=-side*.6}
   for(const x of [-.96,-.32,.32,.96])for(const z of [-2.4,-2.05,-1.7]){
     const stem=cone(g,.18,.43,materials.green,x,.30,z);stem.rotation.z=.06;
   }
   cube(g,.67,.98,.12,timber,0,.6,1.3);
 }else if(kind==='lumber'){
   cube(g,2.5,1.44,1.6,ochre,0,.78,0);
   for(const side of [-1,1]){const r=cube(g,1.5,.13,2.06,roofMat,side*.70,1.82,0);r.rotation.z=-side*.62}
   for(let i=0;i<5;i++){
     const log=cyl(g,.25,.25,1.5,timber,1.4+i*.08,.42+(i%3)*.27,-1.68+(i%2)*.38);
     log.rotation.z=Math.PI/2;
     const end=sphere(g,.20,yellow,1.4+i*.08,.43+(i%3)*.27,-1.68+(i%2)*.38);end.scale.z=.15;
   }
   cyl(g,.15,.19,1.4,materials.wood,-1.4,.7,-1);
   const blade=cube(g,.75,.16,.72,materials.wall,-1.4,1.25,-1);blade.rotation.y=.65;
 }else if(kind==='workshop'){
   cube(g,2.8,1.68,2.2,mat(0xadafa2),0,.88,0);
   for(const side of [-1,1]){const r=cube(g,1.8,.15,2.6,roofMat,side*.78,2.10,0);r.rotation.z=-side*.50}
   cube(g,.54,1.57,.55,timber,1.05,2.18,-.72);
   cube(g,.94,.55,.83,materials.dark,-1.1,.45,1.14);
   const fire=cone(g,.22,.42,new THREE.MeshStandardMaterial({color:0xffae62,emissive:0xe76518,emissiveIntensity:1}),-1.1,.82,1.12);
   g.userData.flame=fire;
   cube(g,.66,.2,.48,materials.wall,1.2,.74,1.06);
 }else if(kind==='market'){
   cube(g,2.75,1.32,2.16,ochre,0,.70,0);
   for(const side of [-1,1]){
     const awning=cube(g,1.66,.13,2.75,side<0?mat(0xe2ac68):mat(0xa64d49),side*.72,1.72,0);
     awning.rotation.z=-side*.49;
   }
   for(const x of [-1.0,0,1.0])for(const z of [-1.2,1.2])cube(g,.19,1.50,.20,timber,x,.77,z);
   for(const x of [-1.15,.4,1.10]){
     const crate=cube(g,.63,.48,.62,timber,x,.32,1.63);crate.rotation.y=x*.27;
   }
   for(const x of [-.9,.9])sphere(g,.32,materials.gold,x,1.05,.97);
 }else if(kind==='forge'){
   cube(g,2.95,1.86,2.35,mat(0x777e7f),0,.95,0);
   for(const side of [-1,1]){
     const roof=cube(g,1.89,.17,2.75,mat(0x934c3e),side*.80,2.25,0);
     roof.rotation.z=-side*.47;
   }
   cube(g,.60,1.1,.52,materials.dark,.9,2.45,-.55);
   const furnace=cube(g,.98,1.25,1.1,materials.rock,-1.04,.65,1.05);
   const flame=cone(g,.30,.75,new THREE.MeshStandardMaterial({
      color:0xff9c45,emissive:0xe85913,emissiveIntensity:1.4
   }),-1.04,1.65,1.05);
   cube(g,.85,.20,.55,materials.dark,.75,.75,1.10);
   const hammer=cyl(g,.11,.11,.88,materials.wood,.70,1.28,1.07);hammer.rotation.z=.75;
 }else if(kind==='infirmary'){
   cube(g,2.85,1.91,2.36,mat(0xe3d7bb),0,1,0);
   for(const side of [-1,1]){
     const roof=cube(g,1.83,.14,2.75,mat(0x5b8d7d),side*.76,2.32,0);
     roof.rotation.z=-side*.47;
   }
   cube(g,.87,1.25,.14,materials.wood,0,.84,1.22);
   const cross1=cube(g,.23,.85,.12,materials.green,0,1.55,1.32);
   const cross2=cube(g,.79,.23,.12,materials.green,0,1.57,1.33);
   for(const x of [-1.2,1.2])sphere(g,.45,materials.green,x,.52,1.62);
 }else if(kind==='quarry'){
   for(let i=0;i<10;i++){
     const rock=mesh(g,new THREE.DodecahedronGeometry(.4+(i%4)*.11,0),
       i%2?materials.wall:materials.rock,rand(-1.25,1.25),.38+(i%3)*.36,rand(-1,1));
     rock.scale.set(1.2,.7,1.1);rock.rotation.y=i*.72;
   }
   cube(g,2.65,.23,.46,timber,0,.66,1.14);
   const crane=cyl(g,.12,.15,2.6,timber,-.92,1.52,-.58);
   crane.rotation.z=.03;
   const beam=cube(g,2.0,.16,.17,timber,-.25,2.78,-.58);beam.rotation.z=-.11;
   const hook=cyl(g,.035,.035,1.15,materials.wall,.53,2.14,-.58);
   cone(g,.21,.30,materials.wall,.53,1.40,-.58);
 }else if(kind==='stable'){
   cube(g,3.25,1.54,2.62,ochre,0,.82,0);
   for(const side of [-1,1]){
     const roof=cube(g,2.12,.16,3.1,mat(0x875945),side*.88,2.08,0);
     roof.rotation.z=-side*.48;
   }
   for(const x of [-1.06,0,1.06]){
     cube(g,.16,1.65,.15,timber,x,.85,1.36);
     cube(g,.91,.77,.12,timber,x,.42,1.43);
   }
   for(const x of [-.78,.78]){
     const horsehead=cube(g,.46,.44,.76,mat(0x846044),x,1.48,1.24);
     horsehead.rotation.x=-.24;
     cone(g,.12,.24,materials.wood,x-.14,1.80,1.0);
     cone(g,.12,.24,materials.wood,x+.14,1.80,1.0);
   }
   cube(g,.65,.25,.71,materials.wood,1.65,.35,.6);
 }else{
   cube(g,3.05,2.02,2.32,ochre,0,1.08,0);
   for(const side of [-1,1]){const r=cube(g,1.98,.19,2.71,roofMat,side*.86,2.47,0);r.rotation.z=-side*.55}
   cube(g,.85,1.25,.12,materials.wood,0,.82,1.23);
   for(const side of [-1,1]){
     cube(g,.45,.46,.13,materials.dark,side*1.1,1.30,1.23);
     cyl(g,.10,.10,2.70,materials.wood,side*1.74,1.35,1.01);
   }
   const banner=mesh(g,new THREE.PlaneGeometry(.65,.9),
     new THREE.MeshBasicMaterial({color:0xb94848,side:THREE.DoubleSide}),1.75,2.48,1.01);
   banner.rotation.y=.12;
 }
 // Architectural evolution: upgrades add larger wings, entrances and roofs.
 for(let tier=2;tier<=level;tier++){
   const wingX=(tier===2?2.0:-2.05),wingHeight=1.0+tier*.26;
   const wingColor=kind==='forge'?mat(0x65777c):kind==='stable'?mat(0x9b7958):
     kind==='lumber'?mat(0x826247):kind==='infirmary'?mat(0xd8dfcf):mat(0xcbb18a);
   cube(g,1.7,wingHeight,1.9,wingColor,wingX,wingHeight*.52,-.38);
   for(const side of [-1,1]){
     const roof=cube(g,1.06,.14,2.2,
       tier===3?mat(0x597e82):kind==='forge'?mat(0x9a5744):mat(0x3c6d83),
       wingX+side*.43,wingHeight+.25,-.38);
     roof.rotation.z=-side*.60;
   }
   if(tier===3){
     cyl(g,.12,.16,2.6,materials.wood,wingX,wingHeight+1.25,-.86);
     const pennant=mesh(g,new THREE.PlaneGeometry(.85,.68),
       new THREE.MeshBasicMaterial({color:kind==='barracks'?0xb94747:0xe9c46f,
       side:THREE.DoubleSide}),wingX+.46,wingHeight+2.08,-.86);
     pennant.castShadow=false;
   }
 }
 // Visual level differentiation: tiered extensions.
 for(let i=1;i<level;i++){
   const corner=cyl(g,.14,.17,.62,materials.gold,-1.04+i*.5,2.19+i*.16,1.05);
   corner.castShadow=true;
 }
 return g;
}
function makeEconomyLabel(building){
 if(building.label){building.group.remove(building.label);
   const map=building.label.material.map;if(map)map.dispose();building.label.material.dispose()}
 const canvas=document.createElement('canvas');canvas.width=300;canvas.height=102;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#193c35e9';ctx.beginPath();ctx.roundRect(6,9,286,85,20);ctx.fill();
 ctx.strokeStyle='#f1d496';ctx.lineWidth=5;ctx.stroke();
 ctx.fillStyle='#f9e4aa';ctx.font='bold 30px sans-serif';ctx.textAlign='center';
 ctx.fillText(economyDefinitions[building.kind].name+' LV '+building.level,150,61);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));
 label.position.set(0,4,0);label.scale.set(3,.96,1);building.group.add(label);building.label=label;
}
function buildEconomy(kind,forced=null,restoring=false,prepaid=false){
 if(!economyDefinitions[kind]||!state.playing||state.betweenWaves||state.dead)return false;
 const plot=forced||nearestPlot(),cost=economyCost(kind);
 if(!plot){showToast('🏘️ მიუახლოვდი მწვანე სამშენებლო ადგილს');return false}
 if(plot.occupied){showToast('აქ უკვე დგას შენობა');return false}
 if(!restoring&&!prepaid&&(state.coins<cost.coins||state.wood<cost.wood)){
   showToast('საჭიროა 🪙 '+cost.coins+' და 🌲 '+cost.wood);return false;
 }
 const model=makeEconomyModel(kind);model.position.copy(plot.group.position);scene.add(model);
 const selectHit=mesh(model,new THREE.BoxGeometry(3.8,4,3.8),
   new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.001,depthWrite:false}),0,1.7,0);
 selectHit.castShadow=false;
 const b={kind,group:model,level:1,plot,hp:180,maxHp:180,tick:cost.interval,spawnTimer:5,workers:0,
   hit:selectHit,decor:null,label:null};
 selectHit.userData.economyBuilding=b;
 plot.occupied=true;plot.building=b;plot.group.visible=false;
 state.economy.push(b);
 selectedEconomy=b;selectedBuild=null;selectedEconomyPlot=null;
 makeEconomyLabel(b);
 if(!restoring){if(!prepaid)state.coins-=cost.coins;state.wood-=cost.wood;state.totalConstruction++;audio.play('build');showToast(cost.name+' აშენებულია!')}
 ui();return true;
}
function upgradeEconomy(prepaid=false){
 if(!selectedEconomy||!state.economy.includes(selectedEconomy)||state.betweenWaves)return;
 const b=selectedEconomy;if(b.level>=3){showToast('⭐ მაქსიმალური დონე');return}
 const cost=economyUpgradePrice(b);
 if(!prepaid&&(state.coins<cost.coins||state.wood<cost.wood)){showToast('საჭიროა 🪙 '+cost.coins+' 🌲 '+cost.wood);return}
 if(!prepaid)state.coins-=cost.coins;state.wood-=cost.wood;
 b.level++;b.maxHp+=95;b.hp=Math.min(b.maxHp,b.hp+110);
 const parent=b.group,oldModel=parent.children.slice(); // rebuilt style without recreating plot or ray hit
 const newDecor=makeEconomyModel(b.kind,b.level);
 if(b.decor)parent.remove(b.decor);
 parent.add(newDecor);b.decor=newDecor;
 // Hide first-build decorative meshes to avoid overlapping roof shapes.
 for(const child of oldModel){if(child!==b.hit&&child!==b.label&&child!==b.decor){parent.remove(child);disposeActor(child)}}
 makeEconomyLabel(b);audio.play('upgrade');showToast(economyDefinitions[b.kind].name+' LV '+b.level);
 ui();
}
function tickEconomy(dt,now){
 for(const b of state.economy){
   if(b.kind==='barracks'&&state.guards.length<9){
     b.spawnTimer=(b.spawnTimer??5)-dt;
     if(b.spawnTimer<=0){
       b.spawnTimer+=5; // One free defender every five seconds per barracks.
       const role=b.level>=2&&Math.floor(state.kills+state.guards.length)%3===1?'archer':'sword';
       recruitGuard(role,false,true,b);
     }
   }
   b.tick-=dt;if(b.tick>0)continue;
   b.tick+=economyDefinitions[b.kind].interval;
   if(b.kind==='farm'){
     const earned=9+b.level*8+(b.workers||0)*7;state.coins+=earned;
     for(let i=0;i<4;i++)particle(b.group.position.x,1,b.group.position.z,0xf4d17d);
     showToast('🌾 ფერმის შემოსავალი +'+earned+' 🪙');
   }else if(b.kind==='lumber'){
     const earned=9+b.level*6+(b.workers||0)*7;state.wood+=earned;
     showToast('🌲 სახერხი +'+earned+' ხე');
   }else if(b.kind==='workshop'){
     const restored=12+b.level*13+(b.workers||0)*9;
     state.fortHP=Math.min(state.maxFortHP,state.fortHP+restored);
     const damaged=state.builds.filter(x=>x.hp<x.maxHp).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];
     if(damaged)damaged.hp=Math.min(damaged.maxHp,damaged.hp+restored*1.8);
     for(let i=0;i<4;i++)particle(b.group.position.x,1.2,b.group.position.z,0xa7f2cd);
   }else if(b.kind==='barracks'){
     for(const g of state.guards)g.hp=Math.min(g.maxHp,g.hp+4+b.level*3+(b.workers||0)*2);
   }else if(b.kind==='market'){
     state.coins+=16+b.level*13+(b.workers||0)*10;
     showToast('🏺 სავაჭრო უბანი • შემოსავალი +'+(16+b.level*13)+' 🪙');
   }else if(b.kind==='forge'){
     state.wood+=2+b.level+(b.workers||0)*2;
     for(const guard of state.guards)guard.hp=Math.min(guard.maxHp,guard.hp+3+b.level);
   }else if(b.kind==='infirmary'){
     state.hp=Math.min(state.maxHp,state.hp+10+b.level*8);
     for(const guard of state.guards)guard.hp=Math.min(guard.maxHp,guard.hp+13+b.level*6);
   }else if(b.kind==='quarry'){
     state.wood+=6+b.level*5+(b.workers||0)*5;
     const weak=state.builds.filter(x=>x.kind==='wall'&&x.hp<x.maxHp)
       .sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
     if(weak)weak.hp=Math.min(weak.maxHp,weak.hp+20+b.level*14);
   }else if(b.kind==='stable'){
     for(const guard of state.guards)
       if(guard.role==='cavalry')guard.hp=Math.min(guard.maxHp,guard.hp+8+b.level*5);
   }
 }
}
const economyRaycaster=new THREE.Raycaster();
renderer.domElement.addEventListener('pointerdown',ev=>{
 if(!state.playing||state.dead||state.betweenWaves||state.paused)return;
 const rect=renderer.domElement.getBoundingClientRect();
 const ndc=new THREE.Vector2((ev.clientX-rect.left)/rect.width*2-1,-(ev.clientY-rect.top)/rect.height*2+1);
 economyRaycaster.setFromCamera(ndc,camera);
 const objects=[...economyPlots.filter(x=>!x.occupied).map(x=>x.info),...state.economy.map(x=>x.hit)];
 const hits=economyRaycaster.intersectObjects(objects,false);if(!hits.length)return;
 const item=hits[0].object;
 const b=item.userData.economyBuilding,plot=item.userData.economyPlot;
 const loc=b?b.group.position:plot.group.position;
 if(dist2(hero.group.position,loc)>13){showToast('🚶 მიუახლოვდი სოფლის ადგილს');return}
 selectedEconomy=b||null;selectedEconomyPlot=plot||null;
 selectedBuild=null;selectedSlot=null;
 showToast(b?economyDefinitions[b.kind].name+' • დონე '+b.level:'🏘️ აირჩიე ახალი შენობა');
 ui();
});
function changeBuildMode(mode){
 buildMode=mode;
 $('defenseBuilds').classList.toggle('hidden',mode!=='defense');
 $('villageBuilds').classList.toggle('hidden',mode!=='village');
  $('armyBuilds').classList.toggle('hidden',mode!=='army');
  $('castleUpgradeBtn').classList.toggle('hidden',mode!=='defense');
 $('defenseTab').classList.toggle('active',mode==='defense');
 $('villageTab').classList.toggle('active',mode==='village');
  $('armyTab').classList.toggle('active',mode==='army');
 ui();
}
const state={playing:false,dead:false,coins:185,wood:75,meteorCd:0,effects:[],score:0,combo:0,comboTimer:0,armyLevel:1,armyFormation:'follow',weaponLevel:0,castleLevel:1,cryCd:0,battleCryTime:0,missionStep:0,missionRewards:0,totalConstruction:0,recruited:0,missionTicker:.1,hp:130,maxHp:130,fortHP:720,maxFortHP:720,
 wave:1,kills:0,level:1,damage:35,attackCd:0,shotInterval:.38,towerBonus:0,towerSpeed:0,
 spawnCd:0,waveLeft:0,spawned:0,waveTotal:0,builds:[],enemies:[],shots:[],pickups:[],particles:[],
 villagers:[],economy:[],guards:[],enemyShots:[],hazards:[],villagerGoal:1,rescued:0,lost:0,totalRescued:0,settlementTier:0,villageIncomeTimer:15,
 dashCd:0,dashTime:0,volleyCd:0,lastTime:0,waveWait:0,betweenWaves:false,paused:false,waveEvent:'normal',miniTimer:0,uiCd:0};
let facing=new THREE.Vector3(0,0,-1),movement=new THREE.Vector2(0,0),lastToast=0;
const keys={};const joystick={x:0,y:0,pointer:null,visualLift:30};
document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&state.playing&&!state.paused&&!state.betweenWaves){saveCheckpoint(true);openPause()}
});
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
 {title:'I • მონღოლთა ალყა',subtitle:'XIII საუკუნე • დავით შავშეთელი იცავს თბილისს',era:'mongol',weather:'normal'},
 {title:'II • შაჰ-აბასის სპარსეთი',subtitle:'XVII საუკუნე • თბილისისთვის ბრძოლა',era:'persian',weather:'siege'},
 {title:'III • თბილისის განმათავისუფლებლები',subtitle:'ისტორიული ფენტეზი • ნარიყალას დაცვა',era:'mongol',weather:'archers'},
 {title:'IV • ნარიყალას საბოლოო დაცვა',subtitle:'ისტორიული ფენტეზი • სპარსეთის სარდლები',era:'persian',weather:'captain'}
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
 siege:'🔥 მძიმე ალყა!',
 captain:'👑 კაპიტანი და ელიტური ჯარი!'
};
function launchEnemyArrow(enemy,targetType,targetObject=null){
 const arrow=new THREE.Group();const start=enemy.group.position;
 arrow.position.set(start.x,1.54,start.z);
 const darkFeather=materials.red;
 cyl(arrow,.045,.045,1.06,materials.wood);
 cone(arrow,.13,.29,materials.wall,0,.69,0);
 cube(arrow,.21,.045,.10,darkFeather,0,-.42,0);
 cube(arrow,.10,.045,.20,darkFeather,0,-.42,0);
 scene.add(arrow);
 const aim=targetType==='hero'?hero.group.position.clone():
    targetType==='guard'&&targetObject?targetObject.group.position.clone():castle.position.clone();
 state.enemyShots.push({mesh:arrow,aim,targetType,targetObject,life:2.25,speed:15.5,damage:9+state.wave*.9});
 audio.play('arrow',.24);
}
function updateEnemyShots(dt){
 for(const shot of [...state.enemyShots]){
   shot.life-=dt;
   const target=shot.aim;
   if(!target||shot.life<=0||!shot.mesh){disposeProjectile(shot.mesh);state.enemyShots.splice(state.enemyShots.indexOf(shot),1);continue}
   const destination=new THREE.Vector3(target.x,shot.targetType==='hero'?1.05:shot.targetType==='guard'?1:2.2,target.z);
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
       state.hp=Math.max(0,state.hp-23-state.wave*.6);
       audio.play('damage',.8);
       if(state.hp<=0)endGame('hero');
     }
     for(const g of [...state.guards])if(dist2(g.group.position,h.position)<2.5)damageGuard(g,29);
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
let restartArmed=false;
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
   economy:state.economy.map(b=>({plot:b.plot.index,kind:b.kind,level:b.level,hp:b.hp,maxHp:b.maxHp,tick:b.tick,workers:b.workers||0,spawnTimer:b.spawnTimer||5})),
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
   if(b.kind==='wall')rebuildWall(b);else if(b.kind==='tower')rebuildTower(b);else decorateBuilding(b);makeUpgradeTag(b);
 }
 for(const item of snap.economy.slice(0,economyPlots.length)){
   const plot=economyPlots[item.plot];if(!plot||plot.occupied||!economyDefinitions[item.kind])continue;
   if(!buildEconomy(item.kind,plot,true))continue;
   const b=state.economy[state.economy.length-1];
   b.level=Math.max(1,Math.min(3,Number(item.level)||1));
   b.maxHp=Math.max(20,Number(item.maxHp)||b.maxHp);b.hp=Math.min(b.maxHp,Math.max(1,Number(item.hp)||b.maxHp));
   b.tick=Math.max(.2,Number(item.tick)||economyDefinitions[b.kind].interval);
   b.workers=Math.max(0,Math.min(4,Number(item.workers)||0));b.spawnTimer=Math.max(.2,Number(item.spawnTimer)||5);
   if(b.level>1){
      const decor=makeEconomyModel(b.kind,b.level);b.group.add(decor);b.decor=decor;
      for(const child of [...b.group.children])if(child!==decor&&child!==b.hit&&child!==b.label){b.group.remove(child);disposeActor(child)};
   }
   makeEconomyLabel(b);
 }
 state.armyLevel=Math.max(1,Math.min(5,snap.armyLevel||1));
 if(snap.worldDeposits){
  for(let i=0;i<slots.length;i++)slots[i].deposit=Math.max(0,Math.min(500,Number(snap.worldDeposits.defense?.[i])||0));
  for(let i=0;i<economyPlots.length;i++){
    const plot=economyPlots[i];
    plot.deposit=Math.max(0,Math.min(500,Number(snap.worldDeposits.village?.[i])||0));
    const pref=snap.worldDeposits.preferred?.[i];
    if(economyDefinitions[pref])plot.preferredKind=pref;
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
 if(!state.playing||state.dead||state.betweenWaves)return;
 $('siteDock').classList.add('hidden');$('troopDock').classList.add('hidden');
 state.paused=true;
 $('pauseSummary').textContent='ტალღა '+state.wave+' • 🪙 '+state.coins+' • 🌲 '+state.wood+
  ' • 🛡️ '+state.guards.length+' მცველი • 🏰 '+Math.ceil(state.fortHP)+' HP';
 $('pauseOverlay').classList.remove('hidden');
 restartArmed=false;$('restartBtn').textContent='↻ თავიდან დაწყება';
}
function closePause(){
 state.paused=false;contextUiTimer=0;$('pauseOverlay').classList.add('hidden');
 for(const key in keys)keys[key]=false;
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
 for(const plot of economyPlots){plot.deposit=0;plot.preferredKind=economyNames[plot.index%economyNames.length]}
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
 $('troopCount').textContent=state.guards.length+'/9';
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
   $('troopDescription').textContent='🛡️ საკუთარი ჯარი • '+state.guards.length+'/9 • მონიშნე მეომარი';
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
function cycleFormation(){
 if(!canActNow())return;
 const index=formationSequence.indexOf(state.armyFormation||'follow');
 state.armyFormation=formationSequence[(index+1)%formationSequence.length];
 showToast('🛡️ ჯარის ბრძანება: '+formationNames[state.armyFormation]);saveCheckpoint(true);
}
$('formationBtn').onclick=cycleFormation;
const unitDefinitions={
 sword:{name:'🛡️ ხმლიანი',coins:35,wood:3,hp:88,damage:21,speed:3.35},
 archer:{name:'🏹 მშვილდოსანი',coins:55,wood:5,hp:64,damage:19,speed:3.15},
 healer:{name:'💚 მკურნალი',coins:70,wood:7,hp:70,damage:0,speed:3.0},
 spear:{name:'🔱 შუბოსანი',coins:85,wood:8,hp:106,damage:32,speed:3.1},
 cavalry:{name:'🐎 ქართველი მხედარი',coins:140,wood:14,hp:150,damage:44,speed:4.65}
};
function armyUpgradeCost(){return{coins:60+state.armyLevel*65,wood:4+state.armyLevel*5}}
function trainArmy(){
 if(!state.playing||state.dead||state.paused||state.betweenWaves)return;
 if(state.armyLevel>=5){showToast('⭐ ჯარი მაქსიმალურად გაწვრთნილია');return}
 if(!barracksCount()){showToast('🛡️ ჯარის გასაწვრთნელად ყაზარმაა საჭირო');return}
 const cost=armyUpgradeCost();
 if(state.coins<cost.coins||state.wood<cost.wood){showToast('საჭიროა 🪙 '+cost.coins+' და 🌲 '+cost.wood);return}
 state.coins-=cost.coins;state.wood-=cost.wood;state.armyLevel++;
 for(const g of state.guards){
   g.maxHp+=18;g.hp=Math.min(g.maxHp,g.hp+30);g.damage+=5;
 }
 for(let i=0;i<14;i++)particle(hero.group.position.x,rand(.4,2),hero.group.position.z,0x89eac2);
 audio.play('upgrade');showToast('🛡️ მოკავშირეების წვრთნა — დონე '+state.armyLevel);ui();saveCheckpoint(true);
}
function recruitGuard(role='sword',restoring=false,freeSpawn=false,sourceBarracks=null){
 if(typeof role==='boolean'){restoring=role;role='sword'}
 if(!unitDefinitions[role]||!state.playing||state.dead||state.betweenWaves||state.paused)return false;
 if(!restoring&&!freeSpawn&&!closestBarracks()){showToast('🛡️ დაქირავებისთვის მიუახლოვდი ყაზარმას');return false}
 if(!restoring&&!freeSpawn&&role==='spear'&&(closestBarracks()?.level||0)<2){
   showToast('🔱 ჯერ ყაზარმა LV2 გააძლიერე');return false;
 }
 if(!restoring&&!freeSpawn&&role==='cavalry'&&!((closestBarracks()?.level||0)>=3
    &&state.economy.some(b=>b.kind==='stable'))){
   showToast('🐎 საჭიროა ყაზარმა LV3 და საჯინიბო');return false;
 }
 if(state.guards.length>=9){showToast('🛡️ მოკავშირეების მაქსიმუმია 9');return false}
 const def=unitDefinitions[role];
 if(!restoring&&!freeSpawn&&(state.coins<def.coins||state.wood<def.wood)){
   showToast('საჭიროა 🪙 '+def.coins+' და 🌲 '+def.wood);return false}
 const soldier=person(role==='sword'?0x39788a:role==='archer'?0x3d805b:role==='spear'?0x527b66:role==='cavalry'?0x8b5d4c:0x7c89a4,false);
 const group=soldier.group,body=soldier.body,arm=body.userData.rightArm;
 if(arm){for(const child of arm.children.slice(1))arm.remove(child)}
 if(role==='sword'){
   const sword=cube(arm,.14,.92,.14,materials.wall,.16,-.28,.33);sword.rotation.z=-.12;
   cube(arm,.45,.11,.16,materials.gold,.15,-.76,.33);
   const shield=new THREE.Group();body.add(shield);shield.position.set(-.54,1.07,.34);
   cyl(shield,.43,.52,.12,mat(0x2e7099)).rotation.x=Math.PI/2;
   cube(shield,.13,.51,.10,materials.gold,0,0,.10);
   cube(shield,.44,.11,.10,materials.gold,0,0,.11);
 }else if(role==='archer'){
   const bow=new THREE.Group();arm.add(bow);bow.position.set(.18,-.40,.26);
   const curve=new THREE.CatmullRomCurve3([
     new THREE.Vector3(.02,-.76,0),new THREE.Vector3(.28,-.43,.03),
     new THREE.Vector3(.38,0,.07),new THREE.Vector3(.28,.43,.03),
     new THREE.Vector3(.02,.76,0)]);
   mesh(bow,new THREE.TubeGeometry(curve,26,.06,7,false),materials.wood);
   mesh(bow,new THREE.TubeGeometry(
     new THREE.LineCurve3(new THREE.Vector3(.02,-.76,0),new THREE.Vector3(.02,.76,0)),1,.014,4,false),materials.gold);
   const quiver=cyl(body,.19,.23,.76,materials.wood,-.40,1.12,-.36);quiver.rotation.z=-.27;
 }else if(role==='spear'){
   const spear=cyl(arm,.065,.065,2.0,materials.wood,.23,.03,.35);
   spear.rotation.z=.15;
   cone(arm,.17,.49,materials.wall,.23,1.18,.35);
   const shield=new THREE.Group();body.add(shield);
   shield.position.set(-.55,1.05,.34);
   const plate=cyl(shield,.44,.46,.12,mat(0x3b6a74));plate.rotation.x=Math.PI/2;
   cube(shield,.13,.48,.12,materials.gold,0,0,.11);
   cube(shield,.43,.11,.12,materials.gold,0,0,.13);
 }else if(role==='cavalry'){
   const sword=cube(arm,.17,1.05,.15,materials.wall,.19,-.16,.34);sword.rotation.z=-.20;
   cube(arm,.47,.13,.16,materials.gold,.19,-.78,.35);
   const horse=createHorse(group);
   horse.scale.setScalar(.96);
   group.userData.alliedHorse=horse;
   const shield=cyl(body,.36,.39,.12,mat(0x4f86a2),-.59,1.21,.36);shield.rotation.x=Math.PI/2;
 }else{
   const staff=cyl(arm,.075,.075,1.54,materials.wood,.17,.16,.25);staff.rotation.z=-.10;
   sphere(arm,.20,mat(0x88f0c9,.3),.22,.96,.25);
   const cap=cone(body,.44,.62,mat(0x7a85b8),0,2.08,0);
   const halo=new THREE.Group();body.add(halo);halo.position.y=2.38;
   const aura=mesh(halo,new THREE.RingGeometry(.27,.36,20),new THREE.MeshBasicMaterial({
     color:0xb1ffe0,transparent:true,opacity:.68,side:THREE.DoubleSide,depthWrite:false}));
   aura.rotation.x=-Math.PI/2;aura.castShadow=false;
 }
 const base=sourceBarracks?.group.position||state.economy.find(b=>b.kind==='barracks')?.group.position||castle.position;
 const index=state.guards.length;
 group.position.set(base.x+(index%3-1)*.65,0,base.z+2+(index%2)*.80);
 const bar=new THREE.Group();group.add(bar);bar.position.y=role==='cavalry'?3.70:2.45;
 cube(bar,.95,.11,.09,materials.dark);
 const green=cube(bar,.94,.095,.105,materials.green,-.01,0,.015);
 scene.add(group);
 const hp=def.hp+(state.armyLevel-1)*18+state.wave*2;
 const guard={kind:'guard',role,group,body,hp,maxHp:hp,damage:def.damage+(state.armyLevel-1)*5,
   speed:def.speed,cd:.35,bar,green,index,healCd:1.2,castFlash:0};
 state.guards.push(guard);
 if(!restoring){
   if(!freeSpawn){state.coins-=def.coins;state.wood-=def.wood}
   audio.play('build',freeSpawn?.17:.7);
   if(!freeSpawn)showToast(def.name+' შემოგიერთდა!');
   state.recruited++;
   if(!freeSpawn)saveCheckpoint(true);
 }
 ui();return true;
}
function removeGuard(g){
 scene.remove(g.group);disposeActor(g.group);
 const idx=state.guards.indexOf(g);if(idx>=0)state.guards.splice(idx,1);
 for(let i=0;i<5;i++)particle(g.group.position.x,1,g.group.position.z,0x90d5da);
 showToast('⚠️ ერთი მცველი დაეცა');
}
function damageGuard(g,amount){
 if(!state.guards.includes(g))return;
 g.hp=Math.max(0,g.hp-amount);
 for(let i=0;i<3;i++)particle(g.group.position.x,1.1,g.group.position.z,0xeab58a);
 if(g.hp<=0)removeGuard(g);
}
function updateGuards(time,dt){
 for(const [i,g] of [...state.guards].entries()){
   const loc=g.group.position;g.cd-=dt;
   const isHealer=g.role==='healer',isArcher=g.role==='archer',isSpear=g.role==='spear',isCavalry=g.role==='cavalry';
   const mode=state.armyFormation||'follow';
   const defendTarget=mode==='defend'?nearest(castle.position,17):null;
   const enemy=isHealer?null:
     mode==='defend'?(defendTarget&&dist2(loc,defendTarget.group.position)<17?defendTarget:null):
     nearest(loc,mode==='attack'?17:isArcher?12.2:8.7);
   let target=null,stop=1.3;
   if(enemy){target=enemy.group.position;stop=isArcher?7.1:isSpear?2.12:1.35}
   else{
     const offset=i*2.399,anchor=mode==='defend'?castle.position:hero.group.position;
     const radius=mode==='defend'?4.7:mode==='attack'?3.5:2.5;
     target=new THREE.Vector3(anchor.x+Math.cos(offset)*radius,0,anchor.z+Math.sin(offset)*radius);
     stop=.40;
   }
   const dx=target.x-loc.x,dz=target.z-loc.z,dist=Math.hypot(dx,dz);
   if(dist>stop){
     const speed=g.speed*(dist>9?1.4:1);
     loc.x+=dx/Math.max(.01,dist)*Math.min(dist-stop,speed*dt);
     loc.z+=dz/Math.max(.01,dist)*Math.min(dist-stop,speed*dt);
   }else if(enemy&&isArcher&&dist<3.0){
     loc.x-=dx/Math.max(.01,dist)*dt*g.speed*.55;
     loc.z-=dz/Math.max(.01,dist)*dt*g.speed*.55;
   }
   if(dist>.15)turnActor(g.group,Math.atan2(dx,dz),dt,12);
   moveActorLegs(g.body,time+i*197,!isCavalry&&dist>stop,dt,g.speed/2.6);
   g.body.position.y=(isCavalry?1.17:0)+Math.abs(Math.sin(time*.012+i))*(dist>stop?.055:.016);
   if(isCavalry&&g.group.userData.alliedHorse)
     g.group.userData.alliedHorse.position.y=Math.abs(Math.sin(time*.014+i))*.075;
   if(isHealer){
     g.healCd-=dt;
     g.body.userData.rightArm.rotation.x=-.40+Math.sin(time*.004+i)*.15;
     if(g.healCd<=0){
       g.healCd=Math.max(.85,2.6-state.armyLevel*.20);
       const damaged=state.guards.filter(a=>a.hp<a.maxHp).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
       if(damaged&&dist2(g.group.position,damaged.group.position)<10){
         const hp=12+state.armyLevel*6+(state.battleCryTime>0?8:0);
         damaged.hp=Math.min(damaged.maxHp,damaged.hp+hp);
         for(let k=0;k<6;k++)particle(damaged.group.position.x,rand(.6,1.7),damaged.group.position.z,0x9ef3c6);
         audio.play('coin',.16);
       }else if(state.hp<state.maxHp&&dist2(loc,hero.group.position)<9){
         state.hp=Math.min(state.maxHp,state.hp+11+state.armyLevel*4);
         for(let k=0;k<6;k++)particle(hero.group.position.x,rand(.4,1.9),hero.group.position.z,0xa5f1d0);
       }
     }
   }else if(enemy&&dist<(isArcher?12.2:isSpear?2.5:isCavalry?2.05:1.76)&&g.cd<=0&&state.enemies.includes(enemy)){
     g.cd=isArcher?Math.max(.49,1.05-state.armyLevel*.09):isSpear?.80:isCavalry?.83:Math.max(.48,.76-state.armyLevel*.035);
     g.body.userData.rightArm.rotation.x=-1.2;
     if(isArcher){
       shoot(new THREE.Vector3(loc.x,1.72,loc.z),enemy,g.damage+(state.battleCryTime>0?8:0),0x9df5af);
     }else{
       const antiHorse=isSpear&&(enemy.type==='cavalry'||enemy.type==='ram')?1.85:1;
       const charge=isCavalry&&(enemy.type==='armored'||enemy.type==='captain')?1.50:1;
       hitEnemy(enemy,Math.round((g.damage+(state.battleCryTime>0?8:0))*antiHorse*charge));
       audio.play('impact',.23);
     }
   }else{
     g.body.userData.rightArm.rotation.x=Math.sin(time*.002+i)*.12;
   }
   g.green.scale.x=Math.max(.001,g.hp/g.maxHp);
   g.green.position.x=-(.94*(1-g.hp/g.maxHp))*.5;
   g.bar.rotation.y=-g.group.rotation.y;
 }
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
        state.rescued++;state.totalRescued++;state.coins+=30;state.wood+=2;growSettlement();
        state.fortHP=Math.min(state.maxFortHP,state.fortHP+24);
        showToast('🏡 ოჯახი უსაფრთხოდაა • +30 🪙 +2 🌲');
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
function showToast(msg){const box=$('toast');box.textContent=msg;box.classList.add('show');clearTimeout(lastToast);lastToast=setTimeout(()=>box.classList.remove('show'),1500)}
function ui(){
  $('coins').textContent=state.coins;$('wave').textContent=state.wave;$('kills').textContent=state.kills;
  $('score').textContent=state.score.toLocaleString('en-US');
  const flash=$('comboFlash');
  if(state.combo>=3&&state.comboTimer>0){
    flash.classList.remove('hidden');
    flash.textContent='⚔️ ×'+state.combo+' COMBO • +ქულები';
  }else flash.classList.add('hidden');
  $('wood').textContent=state.wood;$('guardCount').textContent=state.guards.length+'/9';
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
    ? (defenseNames[selectedSlot.kind]+' • მონიშნული ადგილია')
    : nearestOpen?'მიუახლოვდი 🟡 მონიშნულ ადგილებს, ან შეეხე მათ':'🏰 ციხესიმაგრე სრულად აშენებულია!';
  const info=$('structurePanel'),button=$('structureUpgradeBtn');
  if(selectedEconomy&&state.economy.includes(selectedEconomy)&&dist2(hero.group.position,selectedEconomy.group.position)<=14){
    const b=selectedEconomy,cost=economyUpgradePrice(b);
    info.classList.remove('hidden');
    $('structureLabel').textContent=economyDefinitions[b.kind].name+' • LV '+b.level+'/3 • '+Math.ceil(b.hp)+' HP';
    $('structurePrice').textContent=b.level>=3?'MAX':cost.coins+' 🌲'+cost.wood;
    button.disabled=b.level>=3||state.coins<cost.coins||state.wood<cost.wood;
    button.firstChild.textContent=b.level>=3?'⭐ მაქსიმუმი ':'⬆️ გააძლიერე 🪙 ';
  }else if(selectedBuild&&state.builds.includes(selectedBuild)&&dist2(hero.group.position,selectedBuild.group.position)<=14){
    info.classList.remove('hidden');
    const b=selectedBuild,cost=structureCost(b);
    $('structureLabel').textContent=defenseNames[b.kind]+' • LV '+b.level+'/4'+' • '+Math.ceil(b.hp)+' HP';
    $('structurePrice').textContent=b.level>=4?'MAX':cost;
    button.disabled=b.level>=4||state.coins<cost;
    button.firstChild.textContent=b.level>=4?'⭐ მაქსიმუმი ':'⬆️ გააძლიერე 🪙 ';
  }else{if(selectedBuild&&!state.builds.includes(selectedBuild))selectedBuild=null;if(selectedEconomy&&!state.economy.includes(selectedEconomy))selectedEconomy=null;info.classList.add('hidden');}
  $('upgradePrice').textContent='🪙 '+(60+(state.level-1)*35);
  for(const kind of economyNames){
    const cost=economyDefinitions[kind],btn=$(kind+'Btn');
    if(!btn)continue;
    btn.disabled=state.coins<cost.coins||state.wood<cost.wood||!economyPlots.some(p=>!p.occupied);
  }
  for(const [id,role] of [['recruitBtn','sword'],['archerRecruitBtn','archer'],['medicRecruitBtn','healer']]){
    const cost=unitDefinitions[role];
    $(id).disabled=barracksCount()===0||state.guards.length>=9||state.coins<cost.coins||state.wood<cost.wood;
  }
  const armyCost=armyUpgradeCost();
  $('armyUpgradeCost').textContent=state.armyLevel>=5?'MAX LV5':'🪙'+armyCost.coins+' 🌲'+armyCost.wood;
  $('armyUpgradeBtn').disabled=barracksCount()===0||state.armyLevel>=5||
    state.coins<armyCost.coins||state.wood<armyCost.wood;
  $('guardCount').textContent=state.guards.length+'/9';
  const castleCost=castleUpgradeCost();
  $('castleLevel').textContent=state.castleLevel+'/5';
  $('castleUpgradeCost').textContent=state.castleLevel>=5?'MAX':'🪙 '+castleCost.coins+' 🌲 '+castleCost.wood;
  $('castleUpgradeBtn').disabled=state.castleLevel>=5||state.coins<castleCost.coins||state.wood<castleCost.wood;
  $('cryBtn').disabled=state.cryCd>0||state.betweenWaves||state.paused;
  $('cryCd').textContent=state.cryCd>0?Math.ceil(state.cryCd)+'წ':'მზადაა';
  if(buildMode==='army'){
    $('buildProgress').textContent='🛡️ '+state.guards.length+'/9';
    $('spotHint').textContent='🛡️ ყაზარმა • 3 ტიპის ჯარი • LV '+state.armyLevel+'/5';
  }
  if(buildMode==='village'){
    $('buildProgress').textContent=state.economy.length+'/'+economyPlots.length;
    $('spotHint').textContent=selectedEconomyPlot&&!selectedEconomyPlot.occupied?'🏘️ აირჩიე შენობა ქვემოთ':'🌲 რესურსები • მწვანე ადგილები • მცველები';
  }
  if(buildMode==='defense'&&selectedEconomy&&!state.economy.includes(selectedEconomy))selectedEconomy=null;
  for(const kind of ['trap','ballista']){
    const price=defensePrices[kind];
    $(kind+'Btn').disabled=state.coins<price.coins||state.wood<price.wood||!slots.some(s=>s.kind===kind&&!s.occupied);
  }
  $('wallBtn').disabled=state.coins<20||!slots.some(s=>s.kind==='wall'&&!s.occupied);
  $('towerBtn').disabled=state.coins<45||!slots.some(s=>s.kind==='tower'&&!s.occupied);
  $('upgradeBtn').disabled=state.coins<60+(state.level-1)*35;
  $('healBtn').disabled=state.coins<35||state.hp>=state.maxHp;
  $('dashBtn').disabled=state.dashCd>0;
  $('volleyBtn').disabled=state.volleyCd>0||state.betweenWaves;
  $('volleyCd').textContent=state.volleyCd>0?Math.ceil(state.volleyCd)+'წ':'მზადაა';
  $('meteorBtn').disabled=state.meteorCd>0||state.betweenWaves||state.paused;
  $('meteorCd').textContent=state.meteorCd>0?Math.ceil(state.meteorCd)+'წ':'მზადაა';
}
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
function makeEnemy(){
const boss=state.wave%4===0&&state.spawned===state.waveTotal-1;
const era=eraForWave(state.wave),mongol=era.era==='mongol';
const shah=boss&&!mongol&&state.wave%8===0;
const general=boss&&!shah;
const ram=state.wave>=5&&state.wave%5===0&&state.spawned===state.waveTotal-1;
const roll=Math.random(),cavalry=mongol&&!boss&&!ram&&roll>.81,
 archer=state.wave>=2&&!cavalry&&roll<(state.waveEvent==='archers'?.32:.15)&&!boss&&!ram,
  hard=!cavalry&&!archer&&!ram&&state.wave>=3&&roll<(state.waveEvent==='siege'?.28:.11),
  fast=!cavalry&&!archer&&!ram&&state.wave>=2&&roll>.64;
const p=person(ram?0x765c4b:shah?0x753f64:boss?0x945c42:cavalry?0x8e583f:
  mongol?archer?0x9b754b:hard?0x685044:fast?0x936b41:0xa26b3d:
  archer?0x5b7487:hard?0x923e45:fast?0x90623e:0x9f3e4d);
p.group.scale.setScalar(ram?1.6:shah?1.63:boss?1.50:cavalry?1.12:hard?1.28:fast?.93:1);
if(cavalry||general){
 const animal=createHorse(p.group);
 p.body.position.y=1.18;p.body.scale.setScalar(cavalry?.82:.95);
 p.group.userData.horse=animal;
}
if(mongol&&!ram){
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
 bossTitleSprite(shah?'👑 შაჰ-აბასი • სიუჟეტური ბოსი':
    mongol?'🏇 მონღოლთა გენერალი':'⚔️ სპარსეთის გენერალი',p.group,4.6);
 showToast(shah?'👑 შაჰ-აბასის არმიის შეტევა!':
   mongol?'🏇 მონღოლთა გენერალი მოახლოვდა!':'👑 სპარსეთის გენერალი გამოჩნდა!');
}
const lanes=[0,Math.PI/4,Math.PI/2,Math.PI*3/4,Math.PI,Math.PI*5/4,Math.PI*3/2,Math.PI*7/4];
const lane=lanes[(Math.floor(state.spawned/4)+Math.floor(state.wave/2))%lanes.length];
const angle=lane+rand(-.22,.22),radius=rand(28+Math.min(12,state.wave*.45),35+Math.min(15,state.wave*.42));
p.group.position.set(Math.cos(angle)*radius,0,Math.sin(angle)*radius);scene.add(p.group);
// Strong enemy = 2 direct arrows; giant ram/general = 5; super-boss = 10.
const arrowHits=shah?10:(ram||boss)?5:hard?2:1;
const pressure=1+Math.min(.55,(state.wave-1)*.020)+Math.min(.17,(state.castleLevel-1)*.032);
const hp=Math.max(16,Math.ceil(state.damage*arrowHits*pressure));
const enemyBar=new THREE.Group();enemyBar.position.y=ram?4.00:(boss&&(general||shah))?4.40:cavalry?3.5:hard?2.45:2.28;p.group.add(enemyBar);
const barBack=cube(enemyBar,boss||ram?1.25:.9,.10,.06,materials.dark);
const barFront=cube(enemyBar,boss||ram?1.23:.88,.075,.07,boss||ram?materials.gold:materials.red,0,0,.03);
barBack.castShadow=false;barFront.castShadow=false;
state.enemies.push({barFront,group:p.group,body:p.body,hp,maxHp:hp,arrowHits,speed:ram?1.45:shah?1.92:boss?2.25:cavalry?rand(3.5,4.4):archer?2.25:hard?2.10:fast?rand(3.65,4.45):rand(2.4,2.95)+Math.min(.85,state.wave*.029),cd:rand(0,.5),hit:0,reward:ram?105:boss?65:archer?14:hard?20:fast?10:8,type:ram?'ram':boss?'captain':cavalry?'cavalry':archer?'archer':hard?'armored':fast?'raider':'soldier',faction:era.era,rank:shah?'shah':general?'general':'soldier',specialCd:rand(1.4,3.2)});
state.spawned++;}
function coin(x,z,amount=8){const g=new THREE.Group();const disk=cyl(g,.3,.3,.09,materials.gold,0,.55,0);disk.rotation.z=Math.PI/2;g.position.set(x,0,z);scene.add(g);state.pickups.push({group:g,time:0,amount:Math.random()<.14?amount+5:amount})}
function hitEnemy(e,dmg){audio.play('impact',e.hp<=dmg?.54:.38);
  const impact=e.group.position;
  for(let n=0;n<3;n++)particle(impact.x+rand(-.25,.25),rand(1.0,1.7),impact.z+rand(-.25,.25),0xffc76d);
  e.hp-=dmg;e.hit=.18;if(e.hp<=0){const pos=e.group.position.clone();scene.remove(e.group);disposeActor(e.group);state.enemies.splice(state.enemies.indexOf(e),1);state.kills++;
  state.combo=state.comboTimer>0?Math.min(8,state.combo+1):1;state.comboTimer=2.7;
  state.score+=Math.floor(e.reward*10*(1+.16*(state.combo-1)));
  coin(pos.x,pos.z,e.reward);for(let i=0;i<5;i++)particle(pos.x,1,pos.z,0xffd36b);if(state.kills%25===0)showToast('⚔️ '+state.kills+' მტერი • შესანიშნავია!')}}
function particle(x,y,z,color){if(state.particles.length>=240)return;const p=sphere(scene,.1,new THREE.MeshBasicMaterial({color,transparent:true,opacity:1}),x,y,z);p.castShadow=false;state.particles.push({mesh:p,vx:rand(-2,2),vy:rand(1,4),vz:rand(-2,2),life:.55})}
// Reclaim unique geometries and materials when large enemy waves or upgraded models vanish.
const sharedMaterials=new Set(Object.values(materials));
function disposeActor(group){
 if(!group)return;
 group.traverse(node=>{
   if(node.geometry)node.geometry.dispose();
   if(node.material){
     for(const material of Array.isArray(node.material)?node.material:[node.material]){
       if(sharedMaterials.has(material))continue;
       if(material.map)material.map.dispose();
       material.dispose();
     }
   }
 });
}
function disposeProjectile(group){
  if(!group)return;
  scene.remove(group);
  group.traverse(node=>{if(node.geometry)node.geometry.dispose()});
}
// Aiming: while moving, only shoot towards enemies IN FRONT of the knight;
// while stationary, turn and target the nearest threat. Prevents arrows firing behind him.
let previousAimTarget=null,aimTargetTimer=0;
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
  if(building.kind==='tower')rebuildTower(building);else if(building.kind!=='wall')decorateBuilding(building);makeUpgradeTag(building);
  slot.occupied=true;slot.group.visible=false;selectedSlot=null;selectedBuild=building;selectedEconomy=null;if(!prepaid)state.coins-=cost;state.wood-=price.wood;state.totalConstruction++;
  for(let i=0;i<9;i++)particle(g.position.x,rand(.5,1.7),g.position.z,kind==='wall'?0xffdb87:0x8debd2);
  audio.play('build');showToast(defenseNames[kind]+' მზადაა!');
  ui();
}
function upgrade(){if(!state.playing||state.betweenWaves)return;const cost=60+(state.level-1)*35;if(state.coins<cost)return;state.coins-=cost;state.level++;state.damage+=7;state.maxHp+=18;state.hp=Math.min(state.maxHp,state.hp+35);state.maxFortHP+=25;state.fortHP=Math.min(state.maxFortHP,state.fortHP+55);hero.group.scale.setScalar(1.10+Math.min(state.level-1,4)*.045);audio.play('upgrade');showToast('⬆️ გმირი გაძლიერდა! დონე '+state.level);ui()}
function heal(){if(!state.playing||state.betweenWaves||state.coins<35||state.hp>=state.maxHp)return;state.coins-=35;state.hp=Math.min(state.maxHp,state.hp+30);audio.play('coin',.45);showToast('❤️ სიცოცხლე აღდგენილია');ui()}
function dash(){if(state.dashCd>0||!state.playing||state.betweenWaves)return;state.dashTime=.22;state.dashCd=3;audio.play('dash');showToast('⚡ სწრაფი მოძრაობა')}
function beginWave(){state.betweenWaves=false;showChapter();state.waveEvent=decideWaveEvent(state.wave);state.eventBannerTime=4.2;$('eventBadge').textContent=eventLabels[state.waveEvent];$('eventBadge').classList.remove('hidden');spawnVillagers();state.waveTotal=18+state.wave*5;state.waveLeft=state.waveTotal;state.spawned=0;state.spawnCd=.35;state.waveWait=0;audio.play('wave',.52);showToast('🇬🇪 '+eraForWave(state.wave).title+' • ტალღა '+state.wave);ui()}

function reset(){for(const name of ['enemies','builds','shots','pickups','particles','villagers','economy','guards','enemyShots','hazards','effects']){for(const item of state[name]){
 if(name==='shots'||name==='enemyShots')disposeProjectile(item.mesh);
 else if(name==='particles'){scene.remove(item.mesh);item.mesh.geometry.dispose();item.mesh.material.dispose()}
 else if(name==='effects'){
   scene.remove(item.group);
   item.group.traverse(n=>{if(n.geometry)n.geometry.dispose();
     if(n.material&&!Object.values(materials).includes(n.material))n.material.dispose()})
 }
 else {const o=item.group||item.mesh;scene.remove(o);if(o)disposeActor(o)}
}state[name].length=0}
for(const slot of slots){slot.occupied=false;slot.group.visible=true}
for(const plot of economyPlots){plot.occupied=false;plot.group.visible=true;plot.building=null}
resetWorldPayment();
for(const obj of settlementObjects)scene.remove(obj);settlementObjects.length=0;resetResourceNodes();
selectedSlot=null;selectedBuild=null;selectedEconomy=null;selectedEconomyPlot=null;
  $('rewardOverlay').classList.add('hidden');$('pauseOverlay').classList.add('hidden');changeBuildMode('defense');
Object.assign(state,{playing:true,dead:false,coins:185,wood:75,meteorCd:0,score:0,combo:0,comboTimer:0,armyLevel:1,armyFormation:'follow',weaponLevel:0,castleLevel:1,cryCd:0,battleCryTime:0,missionStep:0,missionRewards:0,totalConstruction:0,recruited:0,missionTicker:.1,hp:130,maxHp:130,fortHP:720,maxFortHP:720,
 wave:1,kills:0,level:1,damage:35,attackCd:0,shotInterval:.38,towerBonus:0,towerSpeed:0,
 spawnCd:0,waveLeft:0,spawned:0,waveTotal:0,dashCd:0,dashTime:0,volleyCd:0,
 villagerGoal:1,rescued:0,lost:0,totalRescued:0,settlementTier:0,villageIncomeTimer:15,betweenWaves:false,paused:false,waveEvent:'normal',miniTimer:0,uiCd:0,waveWait:0});
hero.group.position.set(0,0,3.1);hero.group.scale.setScalar(1.10);previousAimTarget=null;facing.set(0,0,-1);$('intro').classList.add('hidden');$('over').classList.add('hidden');$('guide').classList.add('hidden');$('center').style.pointerEvents='none';beginWave();ui()}
function endGame(reason='hero'){if(state.dead)return;saveRecord(Math.max(0,state.wave-1));$('rewardOverlay').classList.add('hidden');audio.play('defeat');state.dead=true;state.playing=false;$('result').textContent=(reason==='castle'?'🏰 ციხესიმაგრე დაინგრა! ':'🏹 გმირი დამარცხდა! ')+'მიაღწიე '+state.wave+'-ე ტალღამდე • დაამარცხე '+state.kills+' მტერი • ააშენე '+state.builds.length+' ნაგებობა';$('over').classList.remove('hidden');$('center').style.pointerEvents='auto'}
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.17,Math.max(0,(now-(state.lastTime||now))/1000));state.lastTime=now;
const pos=hero.group.position;
if(state.playing&&!state.betweenWaves&&!state.paused){
let vx=(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0)+joystick.x;
let vy=(keys['s']||keys['arrowdown']?1:0)-(keys['w']||keys['arrowup']?1:0)+joystick.y;
let l=Math.hypot(vx,vy);if(l>1){vx/=l;vy/=l;l=1}
const dx=(vx+vy)*.7071068,dz=(-vx+vy)*.7071068;
if(l>.05){movement.set(dx,dz);facing.set(dx,0,dz).normalize();const speed=state.dashTime>0?14:5.4;pos.x=THREE.MathUtils.clamp(pos.x+dx*speed*dt,-78,78);pos.z=THREE.MathUtils.clamp(pos.z+dz*speed*dt,-78,78);turnActor(hero.group,Math.atan2(facing.x,facing.z),dt,11)}
else{movement.set(0,0)}
state.dashTime=Math.max(0,state.dashTime-dt);state.dashCd=Math.max(0,state.dashCd-dt);
state.volleyCd=Math.max(0,state.volleyCd-dt);state.meteorCd=Math.max(0,state.meteorCd-dt);state.cryCd=Math.max(0,state.cryCd-dt);
state.battleCryTime=Math.max(0,state.battleCryTime-dt);state.comboTimer=Math.max(0,state.comboTimer-dt);
state.eventBannerTime=Math.max(0,(state.eventBannerTime||0)-dt);
if(state.eventBannerTime===0)$('eventBadge').classList.add('hidden');
if(state.comboTimer===0)state.combo=0;
state.missionTicker-=dt;if(state.missionTicker<=0){state.missionTicker=.55;updateMissions()}
state.attackCd-=dt;
const target=chooseDavidTarget(pos,facing,l);
if(target && state.attackCd<=0){
  const aim=target.group.position.clone().sub(pos);
  // Face the actual arrow target BEFORE sampling the bow's world-space muzzle.
  hero.group.rotation.y=Math.atan2(aim.x,aim.z);
  const start=pos.clone().addScaledVector(aim.normalize(),.51);start.y=1.54;
  hero.group.updateMatrixWorld(true);
  const rig=hero.body.userData.rig;
  const bowOrigin=rig?rig.bow.localToWorld(new THREE.Vector3(.03,.06,.42)):start;
  shoot(bowOrigin,target,state.damage,0xfbe5a0);
  state.attackCd=state.shotInterval*(state.battleCryTime>0?.76:1);
  if(hero.body.userData.rig){hero.body.userData.rig.draw=0;hero.body.userData.rig.shotFlash=1;}
}else{}
animateArcher(hero.body,now,!!target,dt,l>.05,state.dashTime>0);
if(state.waveLeft>0){
 state.spawnCd-=dt;
 const concurrentMax=innerWidth<760?46:75;
 if(state.spawnCd<=0&&state.enemies.length<concurrentMax){
   makeEnemy();state.waveLeft--;
   state.spawnCd=Math.max(.13,(.31-state.wave*.008)*(state.waveEvent==='rush'?.72:1));
 }
}
else if(state.enemies.length===0){state.waveWait+=dt;
  if(state.waveWait>1.9)presentWaveRewards();
}
for(const enemy of [...state.enemies]){
  const ep=enemy.group.position;
  if((enemy.stun||0)>0){
    enemy.stun=Math.max(0,enemy.stun-dt);
    enemy.body.rotation.z=Math.sin(now*.016+ep.x)*.13;
    continue;
  }
  // Attack the fortress unless the defender is within striking distance.
  let targetingCastle=enemy.type==='ram'||dist2(ep,pos)>6.5;
  let targetPos=targetingCastle?castle.position:pos,targetObj=null;
  const threats=enemy.type==='ram'?[...state.builds,...state.economy]:[...state.guards,...state.builds,...state.economy];
  let closestThreat=3.0;
  for(const b of threats){
    const distance=dist2(ep,b.group.position);
    if(distance<closestThreat){closestThreat=distance;targetPos=b.group.position;targetObj=b;targetingCastle=false}
  }
  if(enemy.type==='archer'){
    // Marksmen prioritize ranged attacks against the fort or player.
    if(!targetObj){targetingCastle=dist2(ep,pos)>10;targetPos=targetingCastle?castle.position:pos}
  }
  const dirx=targetPos.x-ep.x,dirz=targetPos.z-ep.z,dist=Math.hypot(dirx,dirz);
  const desiredDistance=enemy.type==='archer'?(targetObj?5.0:targetingCastle?7.3:6.1):
    (targetObj?1.35:targetingCastle?3.75:1.05);
  if(dist>desiredDistance){
    ep.x+=dirx/Math.max(dist,.1)*enemy.speed*dt;
    ep.z+=dirz/Math.max(dist,.1)*enemy.speed*dt;
  }else if(enemy.type==='archer'&&dist<3.5){
    ep.x-=dirx/Math.max(dist,.1)*enemy.speed*.6*dt;
    ep.z-=dirz/Math.max(dist,.1)*enemy.speed*.6*dt;
  }
  if(dist>.15)turnActor(enemy.group,Math.atan2(dirx,dirz),dt,10);
  enemy.body.position.y=(enemy.type==='ram'?.95:enemy.group.userData.horse?1.18:0)+Math.abs(Math.sin(now*.011+ep.x))*.075;
  if(enemy.group.userData.horse){
    enemy.group.userData.horse.rotation.x=Math.sin(now*.009+ep.x)*.025;
    enemy.group.userData.horse.position.y=Math.abs(Math.sin(now*.012+ep.z))*.055;
  }
  if(enemy.type==='ram'&&enemy.group.userData.ramCart){
     for(const w of enemy.group.userData.ramCart.userData.wheels||[])w.rotation.x+=dt*enemy.speed*2.6;
  }
  moveActorLegs(enemy.body,now+ep.x*300,!enemy.group.userData.horse&&dist>1.25,dt,enemy.speed/2.2);
  if(enemy.body.userData.rightArm)enemy.body.userData.rightArm.rotation.x= -.22+Math.sin(now*.013+ep.z)*.16;
  if(enemy.body.userData.leftArm)enemy.body.userData.leftArm.rotation.x=.14-Math.sin(now*.013+ep.z)*.16;
  enemy.cd-=dt;enemy.hit=Math.max(0,enemy.hit-dt);
  enemy.body.scale.setScalar(enemy.hit>0?1.08:1);
  enemy.body.rotation.z=THREE.MathUtils.lerp(enemy.body.rotation.z,enemy.hit>0?.25:0,Math.min(1,dt*16));
  enemy.body.userData.head.rotation.y=Math.sin(now*.003+ep.x)*.08;
  if(enemy.barFront){
    const width=(enemy.type==='captain'||enemy.type==='ram'?1.23:.88);
    enemy.barFront.scale.x=Math.max(.008,enemy.hp/enemy.maxHp);
    enemy.barFront.position.x=-(width*(1-enemy.hp/enemy.maxHp))*.5;
  }
  if(enemy.type==='captain'){
    enemy.specialCd-=dt;
    if(enemy.specialCd<=0&&dist2(ep,pos)<11){
      bossWarning(enemy);enemy.specialCd=6.0;
    }
  }
  if(enemy.type==='archer'){
    if(dist<13&&enemy.cd<=0){
      const targetType=targetObj?.kind==='guard'?'guard':
        !targetingCastle&&!targetObj?'hero':'fort';
      launchEnemyArrow(enemy,targetType,targetType==='guard'?targetObj:null);
      enemy.cd=Math.max(1.15,2.0-state.wave*.025);
      enemy.body.userData.rightArm.rotation.x=-.95;
    }
    continue;
  }
  if(dist<(targetObj?1.55:targetingCastle?4.15:1.25)&&enemy.cd<=0){
    enemy.cd=.98;
    if(targetObj){
      if(targetObj.kind==='guard'){damageGuard(targetObj,10+state.wave);continue}
      targetObj.hp-=(10+state.wave*(state.waveEvent==='siege'?1.4:1))*(enemy.type==='ram'?2.9:1);
      audio.play('damage',.27);for(let i=0;i<3;i++)particle(ep.x,1,ep.z,0xf4cca4);
      if(targetObj.hp<=0){
        scene.remove(targetObj.group);disposeActor(targetObj.group);
        if(state.builds.includes(targetObj)){
          state.builds.splice(state.builds.indexOf(targetObj),1);
          targetObj.slot.occupied=false;targetObj.slot.group.visible=true;
          if(selectedSlot===targetObj.slot)selectedSlot=null;
          if(selectedBuild===targetObj)selectedBuild=null;
          showToast('🧱 გალავანი დაინგრა • აღადგინე');
        }else if(state.economy.includes(targetObj)){
          state.economy.splice(state.economy.indexOf(targetObj),1);
          targetObj.plot.occupied=false;targetObj.plot.building=null;targetObj.plot.group.visible=true;
          if(selectedEconomy===targetObj)selectedEconomy=null;
          showToast('🔥 სოფლის შენობა განადგურდა!');
        }
      }
    }else if(targetingCastle){
      state.fortHP=Math.max(0,state.fortHP-(7+state.wave*.7)*(state.waveEvent==='siege'?1.45:1)*(enemy.type==='ram'?3.2:1));
      audio.play('damage',.35);for(let i=0;i<3;i++)particle(ep.x,1,ep.z,0xff684e);
      if(state.fortHP<=0)endGame('castle');
    }else if(state.dashTime<=0){
      state.hp=Math.max(0,state.hp-Math.max(4,8+state.wave*.35-state.level*.5));
      audio.play('damage',.7);for(let i=0;i<3;i++)particle(pos.x,1,pos.z,0xff5555);
      if(state.hp<=0)endGame('hero');
    }
  }
}
for(const b of state.builds){
  if(b.kind!=='tower'&&b.kind!=='trap'&&b.kind!=='ballista')continue;
  b.cd-=dt;
  if(b.kind==='trap'){
    const radius=2.7+b.level*.45;
    if(b.group.userData.trapPulse)b.group.userData.trapPulse.material.opacity=.045+
      Math.sin(now*.007+b.group.position.x)*.028;
    if(b.cd<=0){
      const hits=state.enemies.filter(e=>dist2(e.group.position,b.group.position)<radius);
      if(hits.length){
        for(const e of hits){
          hitEnemy(e,9+b.level*6);
          e.stun=Math.max(e.stun||0,.22+b.level*.08);
        }
        for(let i=0;i<Math.min(8,hits.length*2);i++)
          particle(b.group.position.x+rand(-1.3,1.3),rand(.28,1.0),b.group.position.z+rand(-1.3,1.3),0xffb77b);
        b.cd=Math.max(.5,1.18-b.level*.13);
      }else b.cd=.14;
    }
    continue;
  }
  if(b.kind==='ballista'){
    const target=nearest(b.group.position,20+b.level*2.5);
    const head=b.group.userData.ballistaHead;
    if(target&&head){
      const diff=target.group.position.clone().sub(b.group.position);
      head.rotation.y=Math.atan2(diff.x,diff.z)-b.group.rotation.y;
    }
    if(b.cd<=0&&target){
      shoot(new THREE.Vector3(b.group.position.x,2.3,b.group.position.z),
        target,47+b.level*19+state.towerBonus+state.economy.filter(x=>x.kind==='forge').reduce((a,x)=>a+x.level*7,0),0xf6a75a,1.7+b.level*.25);
      if(head)head.rotation.x=-.18;
      b.cd=Math.max(.80,1.75-b.level*.17-state.towerSpeed*.5);
    }
    if(head)head.rotation.x=THREE.MathUtils.lerp(head.rotation.x,0,Math.min(1,dt*4));
    continue;
  }
  const archer=b.group.userData.archer;
  const target=nearest(b.group.position,15.0+b.level*2.0);
  if(archer){
    archer.userData.attackCd=b.cd;
    if(target){
      const diff=target.group.position.clone().sub(b.group.position);
      archer.parent.rotation.y=Math.atan2(diff.x,diff.z)-b.group.rotation.y;
    }
    animateArcher(archer,now,!!target,dt,false,false);
  }
  if(b.cd<=0&&target){
    shoot(new THREE.Vector3(b.group.position.x,b.group.userData.towerHeight||4.1,b.group.position.z),target,20+b.level*11+state.level*2+state.towerBonus+state.economy.filter(x=>x.kind==='forge').reduce((a,x)=>a+x.level*5,0),0x9df5af);
    b.cd=Math.max(.25,.72-b.level*.105-state.towerSpeed);
    if(archer){archer.userData.rig.draw=0;archer.userData.rig.shotFlash=1}
  }
}
for(const shot of [...state.shots]){shot.life-=dt;const bullet=shot.mesh,enemy=shot.to;if(!state.enemies.includes(enemy)||shot.life<=0){disposeProjectile(bullet);state.shots.splice(state.shots.indexOf(shot),1);continue}
const tp=enemy.group.position;const dd=new THREE.Vector3(tp.x,1.05,tp.z).sub(bullet.position),len=dd.length();if(len<.45+shot.speed*dt){
 const point=enemy.group.position.clone();
 disposeProjectile(bullet);state.shots.splice(state.shots.indexOf(shot),1);
 // Direct arrows take the requested number of hits unless allied troops weakened the enemy.
 const arrowDamage=shot.source==='hero'&&enemy.arrowHits?
   Math.max(shot.dmg,Math.ceil(enemy.maxHp/enemy.arrowHits)):shot.dmg;
 hitEnemy(enemy,arrowDamage);
 if(shot.splash>0){
   const hits=state.enemies.filter(e=>dist2(e.group.position,point)<shot.splash);
   for(const e of hits)hitEnemy(e,Math.floor(shot.dmg*.43));
   for(let k=0;k<10;k++)particle(point.x+rand(-1,1),rand(.45,1.45),point.z+rand(-1,1),0xffb160);
 }
}else {
  bullet.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dd.clone().normalize());
  bullet.position.addScaledVector(dd.normalize(),shot.speed*dt);
}}
updateWorldConstruction(dt);tickDepositVisuals(dt);updateVillagers(now,dt);tickSettlement(dt);tickEconomy(dt,now);updateGuards(now,dt);updateEnemyShots(dt);updateHazards(dt);updateResourceNodes(now,dt);updateBattleEffects(dt);
for(const item of [...state.pickups]){
 item.time+=dt;item.group.position.y=Math.sin(item.time*4)*.12;
 item.group.rotation.y+=dt*3.1;
 const gap=dist2(item.group.position,pos);
 if(gap<5.6&&gap>1.30){const step=Math.min(gap-1.25,dt*(4.5+item.time*.16));item.group.position.x+=(pos.x-item.group.position.x)/gap*step;item.group.position.z+=(pos.z-item.group.position.z)/gap*step}
 if(dist2(item.group.position,pos)<1.7){audio.play('coin',.27);state.coins+=item.amount;for(let i=0;i<4;i++)particle(item.group.position.x,.6,item.group.position.z,0xffdf7f);scene.remove(item.group);state.pickups.splice(state.pickups.indexOf(item),1)}}
for(const item of [...state.particles]){item.life-=dt;item.mesh.position.x+=item.vx*dt;item.mesh.position.y+=item.vy*dt;item.mesh.position.z+=item.vz*dt;item.vy-=9*dt;item.mesh.material.opacity=Math.max(0,item.life/.55);if(item.life<=0){scene.remove(item.mesh);item.mesh.geometry.dispose();item.mesh.material.dispose();state.particles.splice(state.particles.indexOf(item),1)}}
for(const plot of economyPlots)if(!plot.occupied)
    plot.group.visible=dist2(plot.group.position,pos)<25;
for(const econ of state.economy)if(econ.label){
    econ.label.visible=selectedEconomy===econ&&dist2(econ.group.position,pos)<15;
  }
for(const b of state.builds){if(b.tag){
    const near=dist2(b.group.position,pos)<13;
    b.tag.visible=false;
  }}
animateSlots(now);
state.miniTimer-=dt;if(state.miniTimer<=0){state.miniTimer=.22;drawMiniMap()}
state.uiCd-=dt;if(state.uiCd<=0){state.uiCd=.08;ui()}
}
updateWeather(dt);
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
function resize(){
 const width=innerWidth,height=innerHeight,aspect=width/height;
 const view=(width<760?18.5:21.0)/cameraZoom;
 camera.left=-view*aspect;camera.right=view*aspect;camera.top=view;camera.bottom=-view;
 camera.updateProjectionMatrix();renderer.setSize(width,height);
}
addEventListener('resize',resize);resize();
$('zoomLabel').textContent=Math.round(cameraZoom*100)+'%';
$('zoomOutBtn').onclick=()=>setCameraZoom(cameraZoom-.085);
$('zoomInBtn').onclick=()=>setCameraZoom(cameraZoom+.085);
renderer.domElement.addEventListener('wheel',ev=>{
 if(!state.playing||state.paused)return;
 if(ev.shiftKey){ev.preventDefault();setCameraZoom(cameraZoom+(ev.deltaY<0?.045:-.045))}
},{passive:false});
addEventListener('keydown',ev=>{const k=ev.key.toLowerCase();keys[k]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))ev.preventDefault();if(k===' '&&!ev.repeat)dash();if(k==='q'&&!ev.repeat)build('wall');if(k==='e'&&!ev.repeat)build('tower');if(k==='r'&&!ev.repeat)upgrade();if(k==='f'&&!ev.repeat)(selectedEconomy?upgradeEconomy():upgradeStructure());if(k==='v'&&!ev.repeat)volley();if(k==='m'&&!ev.repeat)meteorStorm();if(k==='1'&&!ev.repeat)changeBuildMode('defense');if(k==='2'&&!ev.repeat)changeBuildMode('village');if(k==='g'&&!ev.repeat)recruitGuard();if(k==='p'&&!ev.repeat)(state.paused?closePause():openPause());if(k==='b'&&!ev.repeat)battleCry();
if(k==='h'&&!ev.repeat)recruitGuard('archer');if(k==='j'&&!ev.repeat)recruitGuard('healer');
if(k==='3'&&!ev.repeat)changeBuildMode('army');if(k==='-'&&!ev.repeat)setCameraZoom(cameraZoom-.08);if(k==='='&&!ev.repeat)setCameraZoom(cameraZoom+.08)});
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
  // Preserve the clear central battlefield and allow a comfortable movement zone
  // starting a little higher. Touching right-side world/build objects never summons it.
  const minY=Math.max(115,innerHeight*.27);
  const maxX=innerWidth*.49;
  if(ev.clientY<minY||ev.clientX>maxX)return;
  joystick.pointer=ev.pointerId;joystick.cx=ev.clientX;joystick.cy=ev.clientY;
  const lift=Math.min(joystick.visualLift,Math.max(0,ev.clientY-68));
  base.style.left=ev.clientX+'px';base.style.top=(ev.clientY-lift)+'px';
  base.classList.add('active');
  renderer.domElement.setPointerCapture(ev.pointerId);
  // Keep the movement neutral on initial touch; only drag moves David.
  joystick.x=0;joystick.y=0;setStick(0,0);
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
$('meteorBtn').onclick=meteorStorm;
$('structureUpgradeBtn').onclick=()=>selectedEconomy&&state.economy.includes(selectedEconomy)?upgradeEconomy():upgradeStructure();
$('defenseTab').onclick=()=>changeBuildMode('defense');
$('armyTab').onclick=()=>changeBuildMode('army');
$('armyUpgradeBtn').onclick=trainArmy;
$('castleUpgradeBtn').onclick=upgradeCastle;
$('cryBtn').onclick=battleCry;
$('archerRecruitBtn').onclick=()=>recruitGuard('archer');
$('medicRecruitBtn').onclick=()=>recruitGuard('healer');
$('rewardArmy').onclick=()=>chooseReward('army');
$('villageTab').onclick=()=>changeBuildMode('village');
for(const kind of economyNames)if($(kind+'Btn'))$(kind+'Btn').onclick=()=>buildEconomy(kind);
$('recruitBtn').onclick=()=>recruitGuard('sword');
$('pauseBtn').onclick=()=>state.paused?closePause():openPause();
$('resumeBtn').onclick=closePause;
$('saveBtn').onclick=()=>saveCheckpoint();
$('restartBtn').onclick=()=>{
 if(!restartArmed){restartArmed=true;$('restartBtn').textContent='დადასტურება ↻';return}
 closePause();reset();saveCheckpoint(true);
};
$('continueBtn').onclick=restoreSnapshot;
$('cycleBuildingBtn').onclick=cycleWorldBuilding;
$('recruitNearbyBtn').onclick=()=>{
  const roles=['sword','archer','healer'];recruitGuard(roles[state.guards.length%roles.length])
};
$('upgradeHeroQuick').onclick=upgrade;
$('wallBtn').onclick=()=>build('wall');$('towerBtn').onclick=()=>build('tower');$('trapBtn').onclick=()=>build('trap');$('ballistaBtn').onclick=()=>build('ballista');$('upgradeBtn').onclick=upgrade;$('healBtn').onclick=heal;$('dashBtn').onclick=dash;$('startBtn').onclick=()=>{audio.unlock();reset();saveCheckpoint(true)};$('againBtn').onclick=()=>{audio.unlock();reset();saveCheckpoint(true)};
camera.position.set(21,22,22);camera.lookAt(0,0,0);showRecord();hasCheckpoint();ui();updateMissions();drawMiniMap();requestAnimationFrame(frame);

if(location.pathname.toLowerCase().includes('developer')){
const panel=document.createElement('aside');panel.id='devPanel';panel.innerHTML='<div class="devtitle">🛠️ DEVELOPER • GEORGIA 1.01 • ნარიყალა</div><button id="devMoney">🪙 +1000</button><button id="devWood">🌲 +100</button><button id="devGuard">🛡️ მცველი</button><button id="devArcher">🏹 მოკავშირე</button><button id="devHealer">💚 მკურნალი</button><button id="devSiege">🪵 ტარანი</button><button id="devHorde">🔥 დიდი ტალღა</button><button id="devBuild">🎯 ბალისტა</button><button id="devSave">💾 Save</button><button id="devGod">🛡️ უკვდავება OFF</button><button id="devSkip">⏩ შემდეგი ტალღა</button><button id="devFull">❤️ შევსება</button><button id="devWalls">🏰 ყველა ნაგებობა</button>';document.body.append(panel);
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
$('devSkip').onclick=()=>{if(!state.playing)return;for(const e of state.enemies){scene.remove(e.group);disposeActor(e.group)}state.enemies.length=0;state.waveLeft=0;state.waveWait=2.5;showToast('⏩ შემდეგი ტალღა')};
$('devFull').onclick=()=>{state.hp=state.maxHp;state.fortHP=state.maxFortHP;ui();showToast('❤️ შევსებულია')};
$('devWalls').onclick=()=>{if(!state.playing)return;state.coins+=3000;for(const slot of [...slots]){if(!slot.occupied){hero.group.position.set(slot.group.position.x,0,slot.group.position.z+2);selectedSlot=slot;build(slot.kind)}}hero.group.position.set(2,0,6.5);ui()};
}

if(location.pathname.toLowerCase().includes('developer'))window.__GEORGIA_DEV={state,hero,slots,audio,economyPlots,resourceNodes,buildEconomy,upgradeEconomy,tickEconomy,
    recruitGuard,updateGuards,makeEnemy,hitEnemy,shoot,beginWave,bossWarning,saveCheckpoint,restoreSnapshot,decideWaveEvent,battleCry,upgradeCastle,trainArmy,missionProgress,meteorStorm,setCameraZoom,identifyWorldItem,updateWorldConstruction,resetWorldPayment,depositedCoins,depositSpotRing,
    volley,chooseReward,spawnVillagers,presentWaveRewards,get selected(){return selectedBuild},upgradeStructure};
