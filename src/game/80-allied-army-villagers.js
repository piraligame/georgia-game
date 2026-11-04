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
