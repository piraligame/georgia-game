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
// Batch static opaque meshes of each completed building by material.
// Late-game forts contain thousands of tiny model parts; batching them cuts
// draw calls while leaving animated tower archers, hitboxes and labels intact.
function batchBuildingMeshes(root,excluded=[],allowScenery=false){
 if(!mobileRenderer||!root)return;
 root.updateWorldMatrix(true,true);
 const invert=new THREE.Matrix4().copy(root.matrixWorld).invert();
 const groups=new Map();
 root.traverse(node=>{
   if(!node.isMesh||!node.visible||
       !(node.material?.isMeshStandardMaterial||(allowScenery&&node.material?.isMeshBasicMaterial))||
       (node.material.transparent&&!allowScenery)||!node.geometry)return;
   let ancestor=node;
   while(ancestor&&ancestor!==root){
     if(excluded.includes(ancestor))return;
     ancestor=ancestor.parent;
   }
   if(!ancestor)return;
   const g=node.geometry;
   if(!g.getAttribute('position')||!g.getAttribute('normal')||!g.getAttribute('uv'))return;
   if(!groups.has(node.material))groups.set(node.material,[]);
   groups.get(node.material).push(node);
 });
 const v=new THREE.Vector3(),n=new THREE.Vector3(),matrix=new THREE.Matrix4(),norm=new THREE.Matrix3();
 for(const [material,nodes] of groups){
   if(nodes.length<2)continue;
   let verts=0,faces=0;
   for(const node of nodes){
     verts+=node.geometry.getAttribute('position').count;
     faces+=(node.geometry.index?.count||node.geometry.getAttribute('position').count);
   }
   // Preserve memory limits on older GPUs and WebGL index formats.
   if(verts>60000||faces>190000)continue;
   const positions=new Float32Array(verts*3),normals=new Float32Array(verts*3),
     uvs=new Float32Array(verts*2),indices=new Uint16Array(faces);
   let off=0,io=0;
   for(const node of nodes){
     const g=node.geometry,pa=g.getAttribute('position'),na=g.getAttribute('normal'),uv=g.getAttribute('uv');
     matrix.multiplyMatrices(invert,node.matrixWorld);
     norm.getNormalMatrix(matrix);
     for(let i=0;i<pa.count;i++){
       v.fromBufferAttribute(pa,i).applyMatrix4(matrix);
       positions.set([v.x,v.y,v.z],(off+i)*3);
       n.fromBufferAttribute(na,i).applyMatrix3(norm).normalize();
       normals.set([n.x,n.y,n.z],(off+i)*3);
       uvs[(off+i)*2]=uv.getX(i);uvs[(off+i)*2+1]=uv.getY(i);
     }
     const index=g.index;
     const length=index?.count||pa.count;
     for(let i=0;i<length;i++)indices[io++]=off+(index?index.getX(i):i);
     off+=pa.count;
   }
   const merged=new THREE.BufferGeometry();
   merged.setAttribute('position',new THREE.BufferAttribute(positions,3));
   merged.setAttribute('normal',new THREE.BufferAttribute(normals,3));
   merged.setAttribute('uv',new THREE.BufferAttribute(uvs,2));
   merged.setIndex(new THREE.BufferAttribute(indices,1));
   merged.computeBoundingSphere();
   const model=new THREE.Mesh(merged,material);
   model.castShadow=false;model.receiveShadow=false;
   root.add(model);
   for(const node of nodes){
     node.parent?.remove(node);
     if(!cachedGeometries.has(node.geometry))node.geometry.dispose();
   }
 }
}
function optimizeBuildingVisual(b){
 if(!mobileRenderer||!b)return;
 const defense=Boolean(b.slot);
 const root=defense?(b.kind==='wall'?b.group.userData.wallVisual:
   b.kind==='tower'?b.group.userData.towerVisual:b.group):
   b.decor||b.group;
 const archer=b.group.userData.archer?.parent;
 const excluded=[b.hit,b.tag,b.label,b.group.userData.ballistaHead,
   b.group.userData.trapPulse,archer].filter(Boolean);
 if(root===b.group&&b.decor)excluded.push(b.decor);
 batchBuildingMeshes(root,excluded);
}
// Render distant landscape as a few large static mesh batches on phones.
 // This preserves detailed moving people and reduces hundreds of GPU draw calls.
 if(mobileRenderer){
   batchBuildingMeshes(staticScenery,[],true);
   batchBuildingMeshes(oldTbilisi,[],false);
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
 if(b.kind==='wall')rebuildWall(b);else if(b.kind==='tower')rebuildTower(b);else decorateBuilding(b);makeUpgradeTag(b);optimizeBuildingVisual(b);
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
// Distinct BUILD PLAN signs. Important barracks and forge sites stay visible
// farther away, so players never need to guess which pad constructs what.
const specialConstructionColors={barracks:0xc8544b,forge:0xd59042};
