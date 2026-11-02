(() => {
  const $ = (id) => document.getElementById(id);
  const enemies = [
    { name: 'Cinder Wisp', title: 'CINDER WISP', emoji: '👾', hp: 48, attack: 8, rank: 'FLOOR GUARDIAN', intent: 'The wisp gathers heat...' },
    { name: 'Mossback Brute', title: 'MOSSBACK BRUTE', emoji: '👹', hp: 62, attack: 10, rank: 'FLOOR GUARDIAN', intent: 'The brute winds up a heavy blow...' },
    { name: 'Hollowfang', title: 'HOLLOWFANG', emoji: '🐺', hp: 54, attack: 9, rank: 'FLOOR GUARDIAN', intent: 'Hollowfang circles, looking for an opening...' },
    { name: 'Gloam Knight', title: 'GLOAM KNIGHT', emoji: '🗿', hp: 70, attack: 11, rank: 'FLOOR GUARDIAN', intent: 'The knight raises its rusted blade...' },
    { name: 'Ashen Sentinel', title: 'ASHEN SENTINEL', emoji: '🐲', hp: 112, attack: 14, rank: 'TOWER SENTINEL', intent: 'The sentinel draws a breath of cinders...' }
  ];
  const shopGoods = [
    { id: 'potion', icon: '♜', name: 'Health potion', info: 'A flask of redroot · +1 potion', price: 12 },
    { id: 'ether', icon: '✧', name: 'Focus tonic', info: 'Clear the mind · +1 tonic', price: 10 },
    { id: 'power', icon: '⚔', name: 'Tempered edge', info: 'Permanently gain +2 power', price: 24 },
    { id: 'armor', icon: '⬡', name: 'Wayfarer’s charm', info: 'Permanently gain +1 armor', price: 22 },
    { id: 'heal', icon: '✚', name: 'Warm meal', info: 'Restore 35 vitality now', price: 14 }
  ];
  const freshState = () => ({ floor: 1, hp: 100, maxHp: 100, mp: 40, maxMp: 40, power: 12, armor: 0, potions: 3, ethers: 1, gold: 25, xp: 0, level: 1, cleared: 0, enemy: null, enemyHp: 0, enemyMax: 0, burn: 0, guarding: false, phase: 'battle', busy: false });
  let state = freshState();
  let soundOn = false;
  let audio;
  let actionTimer = null;
  let best = Number(localStorage.getItem('emberfall-best') || 1);
  $('runRecord').textContent = `BEST: FLOOR ${String(best).padStart(2, '0')}`;

  function setText(id, text) { $(id).textContent = text; }
  function log(message) { setText('logText', message); }
  function showFloat(text, kind = 'damage', player = false) {
    const el = document.createElement('span');
    el.className = `float-text ${kind}${player ? ' player' : ''}`;
    el.textContent = text;
    $('floatLayer').appendChild(el);
    window.setTimeout(() => el.remove(), 1000);
  }
  function beep(freq = 220, duration = .07) {
    if (!soundOn) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = freq;
      gain.gain.setValueAtTime(.035, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration);
    } catch (_) { /* Audio is an optional flourish. */ }
  }
  function makeEnemy() {
    const isBoss = state.floor % 5 === 0;
    const template = isBoss ? enemies[4] : enemies[(state.floor - 1) % 4];
    const scale = 1 + (state.floor - 1) * (isBoss ? .17 : .135);
    state.enemy = template;
    state.enemyMax = Math.round(template.hp * scale);
    state.enemyHp = state.enemyMax;
    state.burn = 0;
    state.guarding = false;
    $('enemyWrap').classList.toggle('boss', isBoss);
    $('enemyEmoji').textContent = template.emoji;
    setText('enemyName', template.name);
    setText('enemyTitle', template.title);
    setText('enemyRank', template.rank);
    setText('battleTitle', isBoss ? 'A sentinel blocks the way.' : 'A shadow stirs...');
    setText('phaseLabel', `FLOOR ${String(state.floor).padStart(2, '0')} · ${isBoss ? 'SENTINEL' : 'ENCOUNTER'}`);
    setText('intentText', template.intent);
    $('turnBadge').innerHTML = '<span class="turn-dot"></span> YOUR TURN';
    $('turnBadge').classList.remove('enemy-turn');
    state.phase = 'battle';
    state.busy = false;
    log(isBoss ? `${template.name} guards the stairs. Choose your opening move.` : `A ${template.name} blocks the path. What will you do?`);
    render();
  }
  function render() {
    const hpPct = Math.max(0, state.hp / state.maxHp * 100);
    const mpPct = Math.max(0, state.mp / state.maxMp * 100);
    const enemyPct = Math.max(0, state.enemyHp / state.enemyMax * 100);
    $('hpBar').style.width = `${hpPct}%`;
    $('mpBar').style.width = `${mpPct}%`;
    $('enemyHpBar').style.width = `${enemyPct}%`;
    setText('hpText', `${state.hp} / ${state.maxHp}`);
    setText('mpText', `${state.mp} / ${state.maxMp}`);
    setText('enemyHpText', `${Math.max(0, state.enemyHp)} / ${state.enemyMax}`);
    setText('powerText', state.power);
    setText('armorText', state.armor);
    setText('potionCount', `× ${state.potions}`);
    setText('etherCount', `× ${state.ethers}`);
    setText('potionCost', `× ${state.potions}`);
    setText('etherCost', `× ${state.ethers}`);
    setText('goldTop', state.gold);
    setText('floorTop', String(state.floor).padStart(2, '0'));
    setText('towerFloor', String(state.floor).padStart(2, '0'));
    setText('level', `LVL ${String(state.level).padStart(2, '0')}`);
    setText('xpText', `${state.xp} / ${state.level * 40}`);
    setText('progressText', `${state.cleared} ${state.cleared === 1 ? 'floor' : 'floors'} cleared`);
    $('progressBar').style.width = `${Math.max(8, ((state.floor - 1) % 5 + 1) * 20)}%`;
    document.querySelectorAll('.action-card').forEach(button => {
      const action = button.dataset.action;
      const cost = { crescent: 4, ember: 8, mend: 10 }[action] || 0;
      button.disabled = state.phase !== 'battle' || state.busy || state.hp <= 0 || state.enemyHp <= 0 || state.mp < cost || (action === 'potion' && (state.potions <= 0 || state.hp === state.maxHp)) || (action === 'ether' && (state.ethers <= 0 || state.mp === state.maxMp)) || (action === 'mend' && state.hp === state.maxHp);
    });
  }
  function enemyTurn() {
    if (state.phase !== 'battle' || state.enemyHp <= 0) return;
    state.busy = true;
    $('turnBadge').classList.add('enemy-turn');
    $('turnBadge').innerHTML = '<span class="turn-dot"></span> ENEMY TURN';
    setText('intentText', 'The enemy lunges!');
    render();
    actionTimer = window.setTimeout(() => {
      if (state.phase !== 'battle') return;
      let damage = Math.max(1, Math.round(state.enemy.attack * (1 + (state.floor - 1) * .075)) - state.armor);
      const heavy = Math.random() < .22;
      if (heavy) damage = Math.round(damage * 1.55);
      if (state.guarding) { damage = Math.max(1, Math.ceil(damage / 2)); state.guarding = false; }
      state.hp = Math.max(0, state.hp - damage);
      showFloat(`−${damage}`, 'damage', true);
      $('enemyWrap').classList.remove('hit');
      log(`${state.enemy.name} ${heavy ? 'unleashes a heavy strike' : 'strikes'} for ${damage} damage${state.armor ? ` (${state.armor} absorbed)` : ''}.`);
      beep(heavy ? 105 : 155, .1);
      if (state.burn > 0 && state.enemyHp > 0) {
        state.enemyHp = Math.max(0, state.enemyHp - 5);
        state.burn--;
        showFloat('−5 burn');
        log(`${state.enemy.name} suffers 5 burn damage.`);
      }
      render();
      if (state.hp <= 0) { gameOver(); return; }
      if (state.enemyHp <= 0) { victory(); return; }
      state.busy = false;
      $('turnBadge').classList.remove('enemy-turn');
      $('turnBadge').innerHTML = '<span class="turn-dot"></span> YOUR TURN';
      setText('intentText', state.burn ? `${state.enemy.name} smolders. ${state.enemy.intent}` : state.enemy.intent);
      render();
    }, 650);
  }
  function doAction(action) {
    if (state.phase !== 'battle' || state.busy) return;
    let damage = 0;
    switch (action) {
      case 'attack':
        damage = state.power + Math.floor(Math.random() * 5);
        log(`You strike true, dealing ${damage} damage.`); break;
      case 'crescent':
        if (state.mp < 4) return;
        state.mp -= 4; damage = Math.round(state.power * 1.8 + Math.random() * 5);
        log(`Crescent Slash carves through the gloom for ${damage} damage.`); beep(340); break;
      case 'ember':
        if (state.mp < 8) return;
        state.mp -= 8; damage = Math.round(state.power * 1.45 + 10 + Math.random() * 5);
        state.burn = 2; log(`Ember Burst scorches for ${damage}! The foe is burning.`); beep(480); break;
      case 'mend': {
        if (state.mp < 10 || state.hp === state.maxHp) return;
        state.mp -= 10;
        const healed = Math.min(32, state.maxHp - state.hp); state.hp += healed;
        showFloat(`+${healed}`, 'heal', true); log(`Field Mend restores ${healed} vitality.`); beep(520); render(); enemyTurn(); return;
      }
      case 'potion': {
        if (!state.potions) return;
        state.potions--;
        const healed = Math.min(40, state.maxHp - state.hp); state.hp += healed;
        if (!healed) { state.potions++; return; }
        showFloat(`+${healed}`, 'heal', true); log(`You drink a health potion and recover ${healed} vitality.`); beep(520); render(); enemyTurn(); return;
      }
      case 'ether': {
        if (!state.ethers || state.mp === state.maxMp) return;
        state.ethers--;
        const restored = Math.min(20, state.maxMp - state.mp); state.mp += restored;
        showFloat(`+${restored} FP`, 'heal', true); log(`The focus tonic restores ${restored} focus.`); beep(440); render(); enemyTurn(); return;
      }
      case 'guard':
        state.guarding = true; log('You brace behind your guard. The next hit will deal half damage.'); beep(180); render(); enemyTurn(); return;
    }
    state.enemyHp = Math.max(0, state.enemyHp - damage);
    showFloat(`−${damage}`);
    const wrap = $('enemyWrap'); wrap.classList.remove('hit'); void wrap.offsetWidth; wrap.classList.add('hit');
    beep(260 + Math.min(250, damage * 4));
    render();
    if (state.enemyHp <= 0) { window.setTimeout(victory, 350); return; }
    enemyTurn();
  }
  function victory() {
    if (state.phase !== 'battle') return;
    state.phase = 'shop'; state.busy = false; state.cleared++;
    const gold = (state.floor % 5 === 0 ? 28 : 12) + Math.floor(Math.random() * 8);
    const gainedXp = state.floor % 5 === 0 ? 32 : 18;
    state.gold += gold; state.xp += gainedXp;
    let leveled = false;
    while (state.xp >= state.level * 40) {
      state.xp -= state.level * 40; state.level++; state.maxHp += 12; state.maxMp += 4; state.power += 2; state.hp = Math.min(state.maxHp, state.hp + 25); state.mp = Math.min(state.maxMp, state.mp + 12); leveled = true;
    }
    if (state.floor > best) { best = state.floor; localStorage.setItem('emberfall-best', String(best)); setText('runRecord', `BEST: FLOOR ${String(best).padStart(2, '0')}`); }
    $('shopModal').classList.remove('hidden');
    setText('shopTitle', state.floor % 5 === 0 ? 'The Lantern & Latch' : 'The Lantern & Latch');
    setText('shopGold', state.gold);
    $('continueBtn').innerHTML = `Continue to floor ${String(state.floor + 1).padStart(2, '0')} <span>→</span>`;
    log(`Victory! You earn ${gold} gold and ${gainedXp} XP.${leveled ? ' A new level is yours!' : ''}`);
    renderShop(); render();
  }
  function renderShop() {
    setText('shopGold', state.gold);
    $('shopItems').innerHTML = shopGoods.map(item => `<div class="shop-item"><span class="shop-item-icon">${item.icon}</span><div class="shop-item-copy"><strong>${item.name}</strong><small>${item.info}</small></div><button class="buy-btn" data-buy="${item.id}" ${state.gold < item.price || (item.id === 'heal' && state.hp >= state.maxHp) ? 'disabled' : ''}>◉ ${item.price}</button></div>`).join('');
    $('shopItems').querySelectorAll('[data-buy]').forEach(button => button.addEventListener('click', () => buy(button.dataset.buy)));
  }
  function buy(id) {
    const item = shopGoods.find(goods => goods.id === id);
    if (!item || state.gold < item.price) return;
    if (id === 'heal' && state.hp >= state.maxHp) return;
    state.gold -= item.price;
    if (id === 'potion') state.potions++;
    if (id === 'ether') state.ethers++;
    if (id === 'power') state.power += 2;
    if (id === 'armor') state.armor++;
    if (id === 'heal') state.hp = Math.min(state.maxHp, state.hp + 35);
    setText('shopGold', state.gold); renderShop(); render();
    log(`Purchased ${item.name}.`);
  }
  function continueClimb() {
    $('shopModal').classList.add('hidden');
    state.floor++;
    state.hp = Math.min(state.maxHp, state.hp + Math.ceil(state.maxHp * .3));
    state.mp = Math.min(state.maxMp, state.mp + Math.ceil(state.maxMp * .35));
    makeEnemy();
    $('journal').innerHTML = `<div class="journal-item current"><span>${String(Math.ceil(state.floor / 5)).padStart(2, '0')}</span><div><strong>${state.floor % 5 === 0 ? 'The Sentinel’s Stair' : state.floor < 5 ? 'The Spire’s threshold' : 'The endless ascent'}</strong><small>${state.floor % 5 === 0 ? 'A tower sentinel awaits' : `Floor ${String(state.floor).padStart(2, '0')} · onward`}</small></div><i>●</i></div><div class="journal-item"><span>${String(Math.ceil(state.floor / 5) + 1).padStart(2, '0')}</span><div><strong>Unknown heights</strong><small>Keep climbing to reveal</small></div><i>◌</i></div><div class="journal-item locked"><span>✦</span><div><strong>Beyond the known</strong><small>Your story continues</small></div><i>◌</i></div>`;
  }
  function gameOver() {
    state.phase = 'over'; state.busy = false;
    setText('finalFloor', String(state.floor).padStart(2, '0'));
    setText('overCopy', `You reached floor ${state.floor}. The tower remembers your courage.`);
    $('gameOverModal').classList.remove('hidden');
    log('Your strength fails, but your story is not forgotten.'); render();
  }
  function reset() {
    if (actionTimer) window.clearTimeout(actionTimer);
    state = freshState();
    $('shopModal').classList.add('hidden'); $('gameOverModal').classList.add('hidden');
    $('journal').innerHTML = '<div class="journal-item current"><span>01</span><div><strong>The Spire’s threshold</strong><small>Where the ascent begins</small></div><i>●</i></div><div class="journal-item locked"><span>02</span><div><strong>Unknown heights</strong><small>Keep climbing to reveal</small></div><i>◌</i></div><div class="journal-item locked"><span>03</span><div><strong>Unknown heights</strong><small>Keep climbing to reveal</small></div><i>◌</i></div>';
    makeEnemy();
  }
  document.querySelectorAll('.action-card').forEach(button => button.addEventListener('click', () => doAction(button.dataset.action)));
  $('continueBtn').addEventListener('click', continueClimb);
  $('retryBtn').addEventListener('click', reset);
  $('resetBtn').addEventListener('click', () => { if (window.confirm('Start a new run? Your current climb will end.')) reset(); });
  $('soundBtn').addEventListener('click', () => { soundOn = !soundOn; $('soundBtn').textContent = soundOn ? '♫' : '♪'; $('soundBtn').classList.toggle('sound-on', soundOn); if (soundOn) beep(440); });
  makeEnemy();
})();
