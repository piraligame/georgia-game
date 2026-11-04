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
