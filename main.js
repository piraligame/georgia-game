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
const castle=new THREE.Group();scene.add(castle);
cyl(castle,3.25,3.65,.45,materials.rock,0,.22,0);
cube(castle,3.5,2.5,3.5,materials.wall,0,1.7,0);
for(let x of [-1.6,1.6])for(let z of [-1.6,1.6]){cyl(castle,.75,.85,3.8,materials.wall,x,2,z);cone(castle,1,1.7,materials.roof,x,4.75,z)}
cube(castle,1.25,2,.25,materials.wood,0,1.15,1.84);
for(let x=-1.3;x<=1.4;x+=.85)cube(castle,.58,.45,.65,materials.wall,x,3.13,1.65);
const flag=mesh(castle,new THREE.PlaneGeometry(1.5,.85),new THREE.MeshBasicMaterial({color:0xc83b3c,side:THREE.DoubleSide}),0,6.1,0);
flag.rotation.y=-.35;
cyl(castle,.05,.05,4,materials.dark,0,5,0);
const groundRing=mesh(scene,new THREE.RingGeometry(5.5,5.8,64),new THREE.MeshBasicMaterial({color:0xf4d793,transparent:true,opacity:.14,side:THREE.DoubleSide}),0,.015,0);
groundRing.rotation.x=-Math.PI/2;
function person(color,hero=false){const g=new THREE.Group(),body=new THREE.Group();g.add(body);
cyl(body,.4,.49,.95,mat(color),0,.96,0);
sphere(body,.34,materials.skin,0,1.7,0);
sphere(body,.35,hero?materials.dark:mat(0x583e39),0,1.94,-.07);
cube(body,.18,.6,.18,materials.dark,-.22,.31,0);cube(body,.18,.6,.18,materials.dark,.22,.31,0);
cube(body,.18,.72,.19,mat(color),-.49,1.05,0);cube(body,.18,.72,.19,mat(color),.49,1.05,0);
if(hero){cube(body,.67,.15,.6,materials.gold,0,1.43,-.2);cube(body,.15,.72,.16,materials.wall,.58,.86,.25);const blade=cube(body,.12,.92,.13,materials.wall,.58,1.5,.35);blade.rotation.z=-.3;cube(body,.36,.15,.18,materials.wood,.56,1.07,.35)}else{const spear=cyl(body,.06,.06,1.5,materials.wood,.52,.98,.23);spear.rotation.z=-.12;cone(body,.14,.35,materials.wall,.62,1.85,.23)}
return {group:g,body};}
const hero=person(0x286b6a,true);hero.group.position.set(2,0,6.5);scene.add(hero.group);
const heroShadow=mesh(hero.group,new THREE.CircleGeometry(.65,20),new THREE.MeshBasicMaterial({color:0x071918,transparent:true,opacity:.22,depthWrite:false}),0,.02,0);heroShadow.rotation.x=-Math.PI/2;heroShadow.castShadow=false;
const state={playing:false,dead:false,coins:65,hp:100,maxHp:100,wave:1,kills:0,level:1,damage:18,attackCd:0,spawnCd:0,waveLeft:0,spawned:0,waveTotal:0,builds:[],enemies:[],shots:[],pickups:[],particles:[],dashCd:0,dashTime:0,lastTime:0,waveWait:0};
let facing=new THREE.Vector3(0,0,-1),movement=new THREE.Vector2(0,0),lastToast=0;
const keys={};const joystick={x:0,y:0,pointer:null};
function showToast(msg){const box=$('toast');box.textContent=msg;box.classList.add('show');clearTimeout(lastToast);lastToast=setTimeout(()=>box.classList.remove('show'),1500)}
function ui(){$('coins').textContent=state.coins;$('wave').textContent=state.wave;$('kills').textContent=state.kills;$('healthtext').textContent=Math.ceil(state.hp)+' / '+state.maxHp;$('healthbar').style.width=Math.max(0,state.hp/state.maxHp*100)+'%';$('upgradePrice').textContent='🪙 '+(60+(state.level-1)*35);$('wallBtn').disabled=state.coins<20;$('towerBtn').disabled=state.coins<45;$('upgradeBtn').disabled=state.coins<60+(state.level-1)*35;$('healBtn').disabled=state.coins<35||state.hp>=state.maxHp;$('dashBtn').disabled=state.dashCd>0;}
function nearest(source,range,arr=state.enemies){let best=null,ds=range;for(const e of arr){const d=dist2(source,e.group.position);if(d<ds){best=e;ds=d}}return best}
function makeEnemy(){const hard=state.wave>=4 && Math.random()<.15;const p=person(hard?0x7d3f82:0xba5449);p.group.scale.setScalar(hard?1.3:1);const angle=rand(0,Math.PI*2),radius=rand(21,26);p.group.position.set(Math.cos(angle)*radius,0,Math.sin(angle)*radius);scene.add(p.group);state.enemies.push({group:p.group,body:p.body,hp:(hard?78:34)+state.wave*6,maxHp:(hard?78:34)+state.wave*6,speed:hard?1.55:rand(1.8,2.35)+state.wave*.08,cd:rand(0,.5),hit:0,reward:hard?25:8})}
function coin(x,z){const g=new THREE.Group();const disk=cyl(g,.3,.3,.09,materials.gold,0,.55,0);disk.rotation.z=Math.PI/2;g.position.set(x,0,z);scene.add(g);state.pickups.push({group:g,time:0,amount:Math.random()<.18?15:8})}
function hitEnemy(e,dmg){e.hp-=dmg;e.hit=.15;if(e.hp<=0){const pos=e.group.position.clone();scene.remove(e.group);state.enemies.splice(state.enemies.indexOf(e),1);state.kills++;coin(pos.x,pos.z);for(let i=0;i<5;i++)particle(pos.x,1,pos.z,0xffd36b);if(state.kills%10===0)showToast('⚔️ '+state.kills+' მტერი დამარცხებულია!')}}
function particle(x,y,z,color){const p=sphere(scene,.1,new THREE.MeshBasicMaterial({color,transparent:true,opacity:1}),x,y,z);p.castShadow=false;state.particles.push({mesh:p,vx:rand(-2,2),vy:rand(1,4),vz:rand(-2,2),life:.55})}
function shoot(from,to,dmg,color=0xffdf84){const bullet=sphere(scene,.18,new THREE.MeshBasicMaterial({color}),from.x,from.y||1.2,from.z);bullet.castShadow=false;state.shots.push({mesh:bullet,to,dmg,speed:19,life:1.1})}
function build(kind){if(!state.playing||state.dead)return;const cost=kind==='wall'?20:45;if(state.coins<cost){showToast('🪙 არ გაქვს საკმარისი მონეტები');return}
const point=hero.group.position.clone().addScaledVector(facing,3.6);point.x=Math.round(point.x/2)*2;point.z=Math.round(point.z/2)*2;point.y=0;
if(Math.hypot(point.x,point.z)<5||state.builds.some(b=>dist2(point,b.group.position)<2.15)){showToast('აქ აშენება შეუძლებელია — სხვა ადგილზე გადადი');return}
const g=new THREE.Group();g.position.copy(point);if(kind==='wall'){cube(g,2.05,1.4,.78,materials.wall,0,.7,0);for(let x of [-.76,0,.76])cube(g,.46,.4,.95,materials.wall,x,1.56,0)}else{cyl(g,.7,.87,3.2,materials.wood,0,1.6,0);cone(g,1.25,1.8,materials.roof,0,4,0);for(let x of [-.52,.52])cube(g,.14,.9,.14,materials.wall,x,2.9,.55)}
scene.add(g);state.builds.push({group:g,kind,hp:kind==='wall'?130:95,cd:rand(0,.5)});state.coins-=cost;showToast(kind==='wall'?'🧱 კედელი აშენებულია':'🏹 კოშკი აშენებულია');ui();}
function upgrade(){const cost=60+(state.level-1)*35;if(state.coins<cost)return;state.coins-=cost;state.level++;state.damage+=7;state.maxHp+=18;state.hp=Math.min(state.maxHp,state.hp+35);hero.group.scale.setScalar(1+Math.min(state.level-1,4)*.045);showToast('⬆️ გმირი გაძლიერდა! დონე '+state.level);ui()}
function heal(){if(state.coins<35||state.hp>=state.maxHp)return;state.coins-=35;state.hp=Math.min(state.maxHp,state.hp+30);showToast('❤️ სიცოცხლე აღდგენილია');ui()}
function dash(){if(state.dashCd>0||!state.playing)return;state.dashTime=.22;state.dashCd=3;showToast('⚡ სწრაფი მოძრაობა')}
function beginWave(){state.waveTotal=6+state.wave*3;state.waveLeft=state.waveTotal;state.spawned=0;state.spawnCd=.8;state.waveWait=0;showToast('🌊 ტალღა '+state.wave+' იწყება!');ui()}

function reset(){for(const name of ['enemies','builds','shots','pickups','particles']){for(const item of state[name])scene.remove(item.group||item.mesh);state[name].length=0}
Object.assign(state,{playing:true,dead:false,coins:65,hp:100,maxHp:100,wave:1,kills:0,level:1,damage:18,attackCd:0,spawnCd:0,waveLeft:0,spawned:0,waveTotal:0,dashCd:0,dashTime:0,waveWait:0});
hero.group.position.set(2,0,6.5);hero.group.scale.setScalar(1);facing.set(0,0,-1);$('intro').classList.add('hidden');$('over').classList.add('hidden');$('center').style.pointerEvents='none';beginWave();ui()}
function endGame(){state.dead=true;state.playing=false;$('result').textContent='მიაღწიე '+state.wave+'-ე ტალღამდე • დაამარცხე '+state.kills+' მტერი • ააშენე '+state.builds.length+' ნაგებობა';$('over').classList.remove('hidden');$('center').style.pointerEvents='auto'}
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.042,Math.max(0,(now-(state.lastTime||now))/1000));state.lastTime=now;
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
const target=nearest(pos,8.1);
if(target && state.attackCd<=0){shoot(new THREE.Vector3(pos.x,1.65,pos.z),target,state.damage,0xfbe5a0);state.attackCd=.47;hero.body.rotation.z=Math.sin(now*.03)*.17}else{hero.body.rotation.z*=.88}
if(state.waveLeft>0){state.spawnCd-=dt;if(state.spawnCd<=0&&state.enemies.length<18){makeEnemy();state.waveLeft--;state.spawnCd=Math.max(.42,1.3-state.wave*.05)}}
else if(state.enemies.length===0){state.waveWait+=dt;if(state.waveWait>2.4){state.wave++;state.coins+=15;state.hp=Math.min(state.maxHp,state.hp+20);beginWave()}}
for(const enemy of [...state.enemies]){const ep=enemy.group.position;let targetPos=pos,targetObj=null;
for(const b of state.builds){if(dist2(ep,b.group.position)<2.6){targetPos=b.group.position;targetObj=b;break}}
let dirx=targetPos.x-ep.x,dirz=targetPos.z-ep.z;const dist=Math.hypot(dirx,dirz);if(dist>1.05){ep.x+=dirx/dist*enemy.speed*dt;ep.z+=dirz/dist*enemy.speed*dt;enemy.group.rotation.y=Math.atan2(dirx,dirz)}
enemy.body.position.y=Math.sin(now*.01+ep.x)*.055;enemy.cd-=dt;enemy.hit=Math.max(0,enemy.hit-dt);
enemy.body.scale.setScalar(enemy.hit>0?1.15:1);
if(dist<(targetObj?1.35:1.25)&&enemy.cd<=0){enemy.cd=.85;if(targetObj){targetObj.hp-=11+state.wave;if(targetObj.hp<=0){scene.remove(targetObj.group);state.builds.splice(state.builds.indexOf(targetObj),1);showToast('💥 ნაგებობა დაინგრა')}}else if(state.dashTime<=0){state.hp-=Math.max(3,8+state.wave*.6-state.level);for(let i=0;i<3;i++)particle(pos.x,1,pos.z,0xff5555);if(state.hp<=0){state.hp=0;endGame()}}}}
for(const b of state.builds){if(b.kind!=='tower')continue;b.cd-=dt;if(b.cd<=0){const target=nearest(b.group.position,10);if(target){shoot(new THREE.Vector3(b.group.position.x,3,b.group.position.z),target,11+state.level*4,0x9df5af);b.cd=.7}}}
for(const shot of [...state.shots]){shot.life-=dt;const bullet=shot.mesh,enemy=shot.to;if(!state.enemies.includes(enemy)||shot.life<=0){scene.remove(bullet);state.shots.splice(state.shots.indexOf(shot),1);continue}
const tp=enemy.group.position;const dd=new THREE.Vector3(tp.x,1.05,tp.z).sub(bullet.position),len=dd.length();if(len<.45+shot.speed*dt){scene.remove(bullet);state.shots.splice(state.shots.indexOf(shot),1);hitEnemy(enemy,shot.dmg)}else bullet.position.addScaledVector(dd.normalize(),shot.speed*dt)}
for(const item of [...state.pickups]){item.time+=dt;item.group.position.y=Math.sin(item.time*4)*.12;item.group.rotation.y+=dt*3.1;if(dist2(item.group.position,pos)<1.45){state.coins+=item.amount;for(let i=0;i<4;i++)particle(item.group.position.x,.6,item.group.position.z,0xffdf7f);scene.remove(item.group);state.pickups.splice(state.pickups.indexOf(item),1)}}
for(const item of [...state.particles]){item.life-=dt;item.mesh.position.x+=item.vx*dt;item.mesh.position.y+=item.vy*dt;item.mesh.position.z+=item.vz*dt;item.vy-=9*dt;item.mesh.material.opacity=Math.max(0,item.life/.55);if(item.life<=0){scene.remove(item.mesh);state.particles.splice(state.particles.indexOf(item),1)}}
ui();
}
const desired=new THREE.Vector3(pos.x+19,22,pos.z+19);camera.position.lerp(desired,Math.min(1,dt*2.5));camera.lookAt(pos.x,1.05,pos.z);renderer.render(scene,camera)}
function resize(){const width=innerWidth,height=innerHeight,aspect=width/height;const view=width<760?12.2:15.5;camera.left=-view*aspect;camera.right=view*aspect;camera.top=view;camera.bottom=-view;camera.updateProjectionMatrix();renderer.setSize(width,height)}
addEventListener('resize',resize);resize();
addEventListener('keydown',ev=>{const k=ev.key.toLowerCase();keys[k]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))ev.preventDefault();if(k===' '&&!ev.repeat)dash();if(k==='q'&&!ev.repeat)build('wall');if(k==='e'&&!ev.repeat)build('tower');if(k==='r'&&!ev.repeat)upgrade()});
addEventListener('keyup',ev=>{keys[ev.key.toLowerCase()]=false});
addEventListener('blur',()=>{for(const key in keys)keys[key]=false;joystick.x=0;joystick.y=0;setStick(0,0)});
const base=$('joystick'),stick=$('stick');
function setStick(x,y){stick.style.transform='translate('+x*32+'px,'+y*32+'px)'}
function moveStick(ev){const rect=base.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;let x=(ev.clientX-cx)/43,y=(ev.clientY-cy)/43;const len=Math.max(1,Math.hypot(x,y));x/=len;y/=len;joystick.x=x;joystick.y=y;setStick(x,y)}
base.addEventListener('pointerdown',ev=>{if(joystick.pointer!==null)return;joystick.pointer=ev.pointerId;base.setPointerCapture(ev.pointerId);moveStick(ev)});
base.addEventListener('pointermove',ev=>{if(joystick.pointer===ev.pointerId)moveStick(ev)});
function releaseStick(ev){if(joystick.pointer!==ev.pointerId)return;joystick.pointer=null;joystick.x=0;joystick.y=0;setStick(0,0)}
base.addEventListener('pointerup',releaseStick);base.addEventListener('pointercancel',releaseStick);
$('wallBtn').onclick=()=>build('wall');$('towerBtn').onclick=()=>build('tower');$('upgradeBtn').onclick=upgrade;$('healBtn').onclick=heal;$('dashBtn').onclick=dash;$('startBtn').onclick=reset;$('againBtn').onclick=reset;
camera.position.set(21,22,22);camera.lookAt(0,0,0);ui();requestAnimationFrame(frame);

if(location.pathname.toLowerCase().includes('developer')){
const panel=document.createElement('aside');panel.id='devPanel';panel.innerHTML='<div class="devtitle">🛠️ DEVELOPER • GEORGIA 0.1</div><button id="devMoney">🪙 +1000</button><button id="devGod">🛡️ უკვდავება OFF</button><button id="devSkip">⏩ შემდეგი ტალღა</button><button id="devFull">❤️ შევსება</button>';document.body.append(panel);
$('devMoney').onclick=()=>{state.coins+=1000;ui();showToast('🪙 +1000')};
$('devGod').onclick=()=>{const enabled=state.maxHp<5000;if(enabled){state.maxHp=99999;state.hp=99999;}else{state.maxHp=100+(state.level-1)*18;state.hp=state.maxHp}$('devGod').textContent='🛡️ უკვდავება '+(enabled?'ON':'OFF');ui();};
$('devSkip').onclick=()=>{if(!state.playing)return;for(const e of state.enemies)scene.remove(e.group);state.enemies.length=0;state.waveLeft=0;state.waveWait=2.5;showToast('⏩ შემდეგი ტალღა')};
$('devFull').onclick=()=>{state.hp=state.maxHp;ui();showToast('❤️ შევსებულია')};
}
