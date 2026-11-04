function paintEconomySign(plot){
 const kind=plot.preferredKind,def=economyDefinitions[kind];
 if(!def)return;
 if(!plot.signCanvas){
   plot.signCanvas=document.createElement('canvas');
   plot.signCanvas.width=640;plot.signCanvas.height=160;
   plot.signTexture=new THREE.CanvasTexture(plot.signCanvas);
   plot.signTexture.colorSpace=THREE.SRGBColorSpace;
   const sprite=new THREE.Sprite(new THREE.SpriteMaterial({
      map:plot.signTexture,transparent:true,depthTest:false,depthWrite:false}));
   sprite.position.set(0,2.30,0);
   plot.group.add(sprite);plot.sign=sprite;
 }
 const canvas=plot.signCanvas,ctx=canvas.getContext('2d');
 ctx.clearRect(0,0,640,160);
 const special=kind==='barracks'||kind==='forge';
 const main=kind==='barracks'?'#8a302b':kind==='forge'?'#976522':'#244e40';
 ctx.fillStyle=main;ctx.strokeStyle=special?'#ffe0a3':'#a1d5b1';ctx.lineWidth=7;
 ctx.beginPath();ctx.roundRect(8,9,624,139,22);ctx.fill();ctx.stroke();
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ffeed2';
 ctx.font='bold 47px sans-serif';ctx.fillText(def.name,320,65,585);
 ctx.font='bold 30px sans-serif';ctx.fillStyle='#f8df9a';
 ctx.fillText('აშენება • 🪙 '+def.coins+'  🌲 '+def.wood,320,116,585);
 plot.signTexture.needsUpdate=true;
 plot.sign.scale.set(special?7.6:4.0,special?1.90:1.0,1);
 if(plot.colorRing)plot.colorRing.material.color.setHex(
   specialConstructionColors[kind]||0x6fa786);
 plot.sign.visible=true;
}

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
 const colorRing=mesh(g,new THREE.RingGeometry(1.40,1.83,30),
    new THREE.MeshBasicMaterial({color:0x6fa786,side:THREE.DoubleSide,
      transparent:true,opacity:.80,depthWrite:false}),0,.055,0);
 colorRing.rotation.x=-Math.PI/2;colorRing.castShadow=false;plot.colorRing=colorRing;
 // A distinct foundation and corner flag make special build pads visible.
 const beacon=cube(g,.23,1.25,.23,materials.wood,-1.60,.62,-1.42);
 const pennant=mesh(g,new THREE.PlaneGeometry(.85,.55),
     new THREE.MeshBasicMaterial({color:0xe9ca8a,side:THREE.DoubleSide}),
     -1.15,1.26,-1.42);
 pennant.castShadow=false;plot.pennant=pennant;
 info.userData.economyPlot=plot;economyPlots.push(plot);
 paintEconomySign(plot);
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
 const b={kind,group:model,level:1,plot,hp:180,maxHp:180,tick:cost.interval,spawnTimer:60,workers:0,
   hit:selectHit,decor:null,label:null};
 selectHit.userData.economyBuilding=b;
 plot.occupied=true;plot.building=b;plot.group.visible=false;
 state.economy.push(b);
 selectedEconomy=b;selectedBuild=null;selectedEconomyPlot=null;
 makeEconomyLabel(b);optimizeBuildingVisual(b);
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
 makeEconomyLabel(b);optimizeBuildingVisual(b);audio.play('upgrade');showToast(economyDefinitions[b.kind].name+' LV '+b.level);
 ui();
}
function tickEconomy(dt,now){
 for(const b of state.economy){
   if(b.kind==='barracks'&&state.guards.length<9){
     b.spawnTimer=(b.spawnTimer??60)-dt;
     if(b.spawnTimer<=0){
       b.spawnTimer=60; // One free defender per barracks, once every 60 seconds.
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
