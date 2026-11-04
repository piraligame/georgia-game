function reset(){releaseJoystick();for(const name of ['enemies','builds','shots','pickups','particles','villagers','economy','guards','enemyShots','hazards','effects']){for(const item of state[name]){
 if(name==='shots'||name==='enemyShots')disposeProjectile(item.mesh);
 else if(name==='particles'){scene.remove(item.mesh);if(!cachedGeometries.has(item.mesh.geometry))item.mesh.geometry.dispose();item.mesh.material.dispose()}
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
 spawnCd:0,waveLeft:0,spawned:0,waveTotal:0,siegeMode:false,supportWaves:0,supportStage:0,supportQueued:0,supportSpawned:0,supportCd:0,dashCd:0,dashTime:0,volleyCd:0,
 villagerGoal:1,rescued:0,lost:0,totalRescued:0,settlementTier:0,villageIncomeTimer:15,betweenWaves:false,paused:false,waveEvent:'normal',miniTimer:0,uiCd:0,waveWait:0});
hero.group.position.set(0,0,3.1);hero.group.scale.setScalar(1.10);previousAimTarget=null;facing.set(0,0,-1);$('intro').classList.add('hidden');$('over').classList.add('hidden');$('guide').classList.add('hidden');$('center').style.pointerEvents='none';beginWave();ui()}
function endGame(reason='hero'){if(state.dead)return;saveRecord(Math.max(0,state.wave-1));clearCheckpoint();$('rewardOverlay').classList.add('hidden');audio.play('defeat');state.dead=true;state.playing=false;$('result').textContent=(reason==='castle'?'🏰 ციხესიმაგრე დაინგრა! ':'🏹 გმირი დამარცხდა! ')+'მიაღწიე '+state.wave+'-ე ტალღამდე • დაამარცხე '+state.kills+' მტერი • ააშენე '+state.builds.length+' ნაგებობა';$('over').classList.remove('hidden');$('center').style.pointerEvents='auto'}
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.17,Math.max(0,(now-(state.lastTime||now))/1000));state.lastTime=now;
const pos=hero.group.position;
if(state.playing&&!state.paused&&!state.dead){autoSaveAccumulator+=dt;if(autoSaveAccumulator>12){autoSaveAccumulator=0;saveCheckpoint(true)}}
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
// All enemy units remain full fidelity; cap concurrent meshes, NOT total wave size.
const concurrentMax=mobileRenderer?(gamePixelRatio<.85?20:25):54;
scheduleEnemyReinforcements();
state.supportCd=Math.max(0,(state.supportCd||0)-dt);
if(state.supportQueued>0&&state.supportCd<=0&&state.enemies.length<concurrentMax-2){
 makeEnemy(true);state.supportQueued--;state.supportCd=.24;
}
if(state.waveLeft>0){
 state.spawnCd-=dt;
 if(state.spawnCd<=0&&state.enemies.length<concurrentMax){
   makeEnemy();state.waveLeft--;
   state.spawnCd=Math.max(.14,(.294-state.wave*.008)*(state.waveEvent==='rush'?.72:1));
 }
}
else if(state.enemies.length===0&&state.supportQueued===0&&state.supportStage>=state.supportWaves){state.waveWait+=dt;
  if(state.waveWait>1.9)presentWaveRewards();
}
for(const enemy of [...state.enemies]){
  const ep=enemy.group.position;
  if((enemy.stun||0)>0){
    enemy.stun=Math.max(0,enemy.stun-dt);
    enemy.body.rotation.z=Math.sin(now*.016+ep.x)*.13;
    continue;
  }
  // Re-evaluate objective a few times per second, not 60 times, for hundreds of units.
  enemy.targetRefresh=(enemy.targetRefresh||0)-dt;
  if(enemy.targetRefresh<=0||enemy.targetObj&&
      !(state.builds.includes(enemy.targetObj)||state.economy.includes(enemy.targetObj)||state.guards.includes(enemy.targetObj))){
    enemy.targetObj=chooseEnemyObjective(enemy);
    enemy.targetRefresh=.45+(enemy.group.id%5)*.075;
  }
  // A nearby hero can distract infantry, but rams and archers prioritize buildings.
  const heroClose=enemy.type!=='ram'&&enemy.type!=='archer'&&dist2(ep,pos)<2.85;
  let targetObj=heroClose?null:enemy.targetObj;
  let targetingCastle=!heroClose&&!targetObj;
  let targetPos=targetObj?targetObj.group.position:targetingCastle?castle.position:pos;
  // No buildings within reach? Approach the fortress instead of wandering aimlessly.
  if(enemy.type==='archer'&&!targetObj&&dist2(ep,pos)<8.5){
    targetingCastle=false;targetPos=pos;
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
  // The same full-size animated character is displayed across the whole battlefield.
  enemy.group.visible=true;
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
        targetObj?'structure':!targetingCastle?'hero':'fort';
      launchEnemyArrow(enemy,targetType,targetObj);
      enemy.cd=Math.max(.9,1.8-state.wave*.02);
      enemy.body.userData.rightArm.rotation.x=-.95;
    }
    continue;
  }
  if(dist<(targetObj?1.55:targetingCastle?4.15:1.25)&&enemy.cd<=0){
    enemy.cd=.98;
    if(targetObj){
      if(targetObj.kind==='guard'){damageGuard(targetObj,(10+state.wave)*2);continue}
      const strike=(10+state.wave*(state.waveEvent==='siege'?1.4:1))*
        (enemy.type==='ram'?2.9:1)*2;
      damageStructure(targetObj,strike);
      audio.play('damage',.22);for(let i=0;i<2;i++)particle(ep.x,1,ep.z,0xf4cca4);
    }else if(targetingCastle){
      state.fortHP=Math.max(0,state.fortHP-(7.7+state.wave*.77)*(state.waveEvent==='siege'?1.45:1)*(enemy.type==='ram'?3.2:1)*2);
      audio.play('damage',.35);for(let i=0;i<3;i++)particle(ep.x,1,ep.z,0xff684e);
      if(state.fortHP<=0)endGame('castle');
    }else if(state.dashTime<=0){
      state.hp=Math.max(0,state.hp-Math.max(4,9+state.wave*.42-state.level*.5)*2);
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
 if(dist2(item.group.position,pos)<1.7){audio.play('coin',.27);state.coins+=item.amount;for(let i=0;i<4;i++)particle(item.group.position.x,.6,item.group.position.z,0xffdf7f);scene.remove(item.group);disposeActor(item.group);state.pickups.splice(state.pickups.indexOf(item),1)}}
for(const item of [...state.particles]){item.life-=dt;item.mesh.position.x+=item.vx*dt;item.mesh.position.y+=item.vy*dt;item.mesh.position.z+=item.vz*dt;item.vy-=9*dt;item.mesh.material.opacity=Math.max(0,item.life/.55);if(item.life<=0){scene.remove(item.mesh);if(!cachedGeometries.has(item.mesh.geometry))item.mesh.geometry.dispose();item.mesh.material.dispose();state.particles.splice(state.particles.indexOf(item),1)}}
for(const plot of economyPlots)if(!plot.occupied)
    plot.group.visible=dist2(plot.group.position,pos)<((plot.preferredKind==='barracks'||plot.preferredKind==='forge')?57:29);
for(const econ of state.economy)if(econ.label){
    econ.label.visible=selectedEconomy===econ&&dist2(econ.group.position,pos)<15;
  }
for(const b of state.builds){if(b.tag){
    const near=dist2(b.group.position,pos)<13;
    b.tag.visible=false;
  }}
animateSlots(now);
state.miniTimer-=dt;if(state.miniTimer<=0){state.miniTimer=.40;drawMiniMap()}
state.uiCd-=dt;if(state.uiCd<=0){state.uiCd=.19;ui()}
}
updateWeather(dt);
if(!mobileRenderer||Math.floor(now/33)%2===0)for(const tree of ambientTrees){
  tree.rotation.z=Math.sin(now*.0011+tree.userData.wind)*.008;
  tree.rotation.x=Math.sin(now*.0013+tree.userData.wind)*.006;
}
for(const torch of castleTorches){
  torch.flame.scale.y=.84+.18*Math.sin(now*.019+torch.phase);
  torch.flame.rotation.y+=dt*.55;
}
flag.rotation.y=-.35+Math.sin(now*.0017)*.075;
const desired=cameraFollowPosition(pos);
camera.position.lerp(desired,Math.min(1,dt*3.4));
camera.lookAt(pos.x,1.05,pos.z);
renderer.render(scene,camera);tuneGraphics(dt)}
