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
