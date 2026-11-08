import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { createGameAudio } from './audio.js?v=1.11';

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
// Scalable resolution avoids sustained overheating on phones with large late-game armies.
const mobileRenderer=innerWidth<760;
let gamePixelRatio=Math.min(devicePixelRatio||1,mobileRenderer?1.05:1.5);
renderer.setPixelRatio(gamePixelRatio);
let fpsTime=0,fpsFrames=0,fpsGoodStreak=0;
function tuneGraphics(dt){
 if(!mobileRenderer||!state.playing||state.paused)return;
 fpsTime+=Math.min(dt,.1);fpsFrames++;
 if(fpsTime<2.4)return;
 const fps=fpsFrames/fpsTime;fpsTime=0;fpsFrames=0;
 if(fps<43&&gamePixelRatio>.76){
   gamePixelRatio=Math.max(.76,gamePixelRatio-.12);
   renderer.setPixelRatio(gamePixelRatio);
   fpsGoodStreak=0;
 }else if(fps>57&&gamePixelRatio<1.05){
   if(++fpsGoodStreak>=4){
     gamePixelRatio=Math.min(1.05,gamePixelRatio+.08);
     renderer.setPixelRatio(gamePixelRatio);
     fpsGoodStreak=0;
   }
 }else fpsGoodStreak=0;
}
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !mobileRenderer;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('game').appendChild(renderer.domElement);
const camera = new THREE.OrthographicCamera(-13,13,9,-9,.1,480);
let cameraZoom=.78; // Player's existing zoom preference is retained.
// Orthographic view: at low zoom the old camera sat too close to the ground.
// Lower viewport rays started BELOW the ground, clipping the terrain and
// exposing an empty sky-colored strip. Keep the same viewing angle and
// projection while moving the camera back far enough to see all near terrain.
function cameraFollowPosition(pos){
 const zoomDistance=Math.max(1.47,1.04/cameraZoom);
 return new THREE.Vector3(
   pos.x+19*zoomDistance,
   1.05+20.95*zoomDistance,
   pos.z+19*zoomDistance
 );
}
function setCameraZoom(value){
 cameraZoom=THREE.MathUtils.clamp(Number(value)||.78,.53,1.20);
 resize();
 // Immediately reframe while zoom changes; do not wait for the lerped follow
 // camera or show a temporarily empty strip at the bottom.
 if(typeof hero!=='undefined')camera.position.copy(cameraFollowPosition(hero.group.position));
 if($('zoomLabel'))$('zoomLabel').textContent=Math.round(cameraZoom*100)+'%';
 try{localStorage.setItem('georgia-zoom-v1',String(cameraZoom))}catch{}
}
try{const z=Number(localStorage.getItem('georgia-zoom-v1'));if(z>=.53&&z<=1.20)cameraZoom=z}catch{}
const sun = new THREE.DirectionalLight(0xffedc6,2.1);
sun.position.set(-17,35,14);
sun.castShadow=true;
sun.shadow.mapSize.set(innerWidth<760?512:1024,innerWidth<760?512:1024);
sun.shadow.camera.left=-36;sun.shadow.camera.right=36;sun.shadow.camera.top=36;sun.shadow.camera.bottom=-36;
const hemiLight=new THREE.HemisphereLight(0xe8f6e9,0x4c5b36,2);
scene.add(sun,hemiLight);
// Reuse immutable materials and primitive geometry across armies/buildings.
const cachedMaterials=new Map(),cachedMaterialSet=new Set();
const mat=(color,roughness=1)=>{
 const key=color+':'+roughness;
 let material=cachedMaterials.get(key);
 if(!material){
   material=new THREE.MeshStandardMaterial({color,roughness});
   cachedMaterials.set(key,material);cachedMaterialSet.add(material);
 }
 return material;
};
const primitiveGeometryCache=new Map(),cachedGeometries=new Set();
function primitiveGeometry(kind,args,create){
 // Random-sized scenery stays uncached; fixed-size army/building primitives are shared.
 if(!args.every(n=>Math.abs(n-Math.round(n*1000)/1000)<1e-8))return create();
 const key=kind+':'+args.join(',');
 let geo=primitiveGeometryCache.get(key);
 if(!geo){
   geo=create();primitiveGeometryCache.set(key,geo);cachedGeometries.add(geo);
 }
 return geo;
}
const materials={grass:mat(0x7baf70),dirt:mat(0xbaa478),rock:mat(0x807f75),wall:mat(0xc1bba9),dark:mat(0x47515a),wood:mat(0x8d5f39),roof:mat(0xb3563a),gold:mat(0xffd25e,.35),red:mat(0xb54c46),enemy:mat(0xaa4945),yellow:mat(0xffd979),green:mat(0x247963),skin:mat(0xf2bf91),shadow:mat(0x253a2d)};
function mesh(parent,geo,material,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function cube(parent,w,h,d,material,x=0,y=0,z=0){return mesh(parent,primitiveGeometry('box',[w,h,d],()=>new THREE.BoxGeometry(w,h,d)),material,x,y,z)}
function sphere(parent,r,material,x=0,y=0,z=0){return mesh(parent,primitiveGeometry('sphere',[r],()=>new THREE.SphereGeometry(r,10,8)),material,x,y,z)}
function cone(parent,r,h,material,x=0,y=0,z=0){return mesh(parent,primitiveGeometry('cone',[r,h],()=>new THREE.ConeGeometry(r,h,7)),material,x,y,z)}
function cyl(parent,top,bottom,h,material,x=0,y=0,z=0){return mesh(parent,primitiveGeometry('cylinder',[top,bottom,h],()=>new THREE.CylinderGeometry(top,bottom,h,8)),material,x,y,z)}
function rand(min,max){return min+Math.random()*(max-min)}
function dist2(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
const floor=mesh(scene,new THREE.PlaneGeometry(420,420),materials.grass);
floor.rotation.x=-Math.PI/2;floor.position.y=-.06;floor.castShadow=false;
const staticScenery=new THREE.Group();scene.add(staticScenery);
const patchMat=[
  new THREE.MeshBasicMaterial({color:0x98bb7d,transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide}),
  new THREE.MeshBasicMaterial({color:0x62975f,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}),
  new THREE.MeshBasicMaterial({color:0xbdaf7b,transparent:true,opacity:.09,depthWrite:false,side:THREE.DoubleSide})
];
for(let i=0;i<260;i++){
  const x=rand(-155,155),z=rand(-155,155);
  const patch=mesh(staticScenery,new THREE.CircleGeometry(rand(.65,1.7),9),patchMat[i%3],x,-.044,z);
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
for(let i=0;i<130;i++){let x=rand(-94,94),z=rand(-94,94);if(Math.hypot(x,z)<11)continue;const t=new THREE.Group();t.position.set(x,0,z);cyl(t,.25,.35,2.3,trunkMat,0,1,0);cone(t,1.5,3.5,[leaf1,leaf2,leaf3][i%3],0,3.5,0);cone(t,1.15,3,[leaf1,leaf2,leaf3][(i+1)%3],0,5,0);t.scale.setScalar(rand(.7,1.25));t.userData.wind=rand(0,6.28);staticScenery.add(t);if(i%2===0&&!mobileRenderer)ambientTrees.push(t)}
for(let i=0;i<115;i++){let x=rand(-74,74),z=rand(-74,74);if(Math.hypot(x,z)<6)continue;const g=new THREE.Group();g.position.set(x,0,z);if(i%3===0){sphere(g,rand(.17,.35),materials.rock,0,.1,0)}else{cone(g,.32,rand(.45,.85),i%2?leaf2:leaf3,0,.28,0)}staticScenery.add(g)}

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
