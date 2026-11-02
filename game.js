(() => {
  const $ = (id) => document.getElementById(id);
  const enemies = [
    { name: 'Cinder Wisp', title: 'CINDER WISP', emoji: '🔥', hp: 48, attack: 8, rank: 'MYTHIC WRAITH', intent: 'The wisp gathers heat...', skin: 'wisp' },
    { name: 'Mossback Behemoth', title: 'MOSSBACK BEHEMOTH', emoji: '🦍', hp: 62, attack: 10, rank: 'ANCIENT COLOSSUS', intent: 'The behemoth winds up a crushing blow...', skin: 'behemoth' },
    { name: 'Hollowfang Direwolf', title: 'HOLLOWFANG DIREWOLF', emoji: '🐺', hp: 54, attack: 9, rank: 'MOON-CURSED HUNTER', intent: 'Hollowfang circles, looking for an opening...', skin: 'direwolf' },
    { name: 'Gloam Knight', title: 'GLOAM KNIGHT', emoji: '🛡️', hp: 70, attack: 11, rank: 'OATHBOUND PHANTOM', intent: 'The knight raises its spectral blade...', skin: 'knight' },
    { name: 'Ashen World-Serpent', title: 'ASHEN WORLD-SERPENT', emoji: '🐉', hp: 112, attack: 14, rank: 'TOWER SENTINEL · PRIMORDIAL', intent: 'The serpent draws a breath of starfire...', skin: 'serpent' }
  ];
  const classes = {
    knight: { name: 'Knight', hero: 'Sir Rowan', title: 'Oathbound Knight', icon: '⚔', hp: 110, mp: 36, power: 13, armor: 2, skills: ['crescent', 'riposte'], tint: 'knight' },
    mage: { name: 'Mage', hero: 'Mira Ashveil', title: 'Ember Mage', icon: '✦', hp: 88, mp: 56, power: 11, armor: 0, skills: ['ember', 'mend'], tint: 'mage' },
    archer: { name: 'Archer', hero: 'Lark Fenwood', title: 'Spirewood Archer', icon: '➶', hp: 96, mp: 44, power: 12, armor: 1, skills: ['aimed', 'volley'], tint: 'archer' }
  };
  const classSkills = {
    crescent: { name: 'Crescent Slash', icon: '☽', cost: 4, info: 'A sweeping arc of steel.', classId: 'knight', damage: 1.8, bonus: 0 },
    riposte: { name: 'Riposte', icon: '⬡', cost: 6, info: 'Brace and answer the next strike.', classId: 'knight', damage: 1.35, bonus: 2, guard: true },
    ember: { name: 'Ember Burst', icon: '♨', cost: 8, info: 'Blast the foe with flame and inflict burn.', classId: 'mage', damage: 1.45, bonus: 10, burn: 2 },
    mend: { name: 'Field Mend', icon: '✚', cost: 10, info: 'Restore up to 32 vitality.', classId: 'mage', heal: 32 },
    aimed: { name: 'Aimed Shot', icon: '➶', cost: 4, info: 'A precise, armor-piercing shot.', classId: 'archer', damage: 2.05, bonus: 3 },
    volley: { name: 'Rain of Arrows', icon: '✣', cost: 8, info: 'Loose a swift flurry of arrows.', classId: 'archer', damage: 1.7, bonus: 8 }
  };
  const skillBooks = [
    { id: 'starfall', classId: 'mage', name: 'Starfall', icon: '☄', price: 38, cost: 9, info: 'Call down a shard of the night sky for heavy damage.', damage: 1.9, bonus: 16, title: 'STARFALL' },
    { id: 'aegis', classId: 'knight', name: 'Warden’s Aegis', icon: '⬡', price: 32, cost: 7, info: 'Restore vitality and brace against the next strike.', heal: 24, title: 'WARDEN’S AEGIS' },
    { id: 'windshot', classId: 'archer', name: 'Windshot', icon: '➶', price: 34, cost: 7, info: 'A gale-guided shot that strikes with extra force.', damage: 2.1, bonus: 12, title: 'WINDSHOT' }
  ];
  const getTownNpcs = () => {
    const profile = classes[state.classId];
    return profile ? [{ id: `${state.classId}-sage`, type: 'class-specialist', name: state.classId === 'mage' ? 'Ilyra the Emberwise' : state.classId === 'archer' ? 'Tamsin Farstrider' : 'Sister Maelin', role: `${profile.name} skill specialist`, icon: profile.icon, greeting: 'The Spire tests every traveler. Choose a technique worth carrying upward.' }] : [];
  };
  const shopGoods = [
    { id: 'potion', icon: '♜', name: 'Health potion', info: 'A flask of redroot · +1 potion', price: 12 },
    { id: 'ether', icon: '✧', name: 'Focus tonic', info: 'Clear the mind · +1 tonic', price: 10 },
    { id: 'power', icon: '⚔', name: 'Tempered edge', info: 'Permanently gain +2 power', price: 24 },
    { id: 'armor', icon: '⬡', name: 'Wayfarer’s charm', info: 'Permanently gain +1 armor', price: 22 },
    { id: 'heal', icon: '✚', name: 'Warm meal', info: 'Restore 35 vitality now', price: 14 }
  ];
  const freshState = () => ({ classId: null, floor: 1, hp: 100, maxHp: 100, mp: 40, maxMp: 40, power: 12, armor: 0, potions: 3, ethers: 1, gold: 25, xp: 0, level: 1, cleared: 0, enemy: null, enemyHp: 0, enemyMax: 0, burn: 0, guarding: false, learnedSkills: [], phase: 'battle', busy: false, menu: 'fight' });
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
    $('enemyWrap').dataset.skin = template.skin;
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
  function renderShopStatus() {
    const hpPct = Math.max(0, Math.min(100, state.hp / state.maxHp * 100));
    const mpPct = Math.max(0, Math.min(100, state.mp / state.maxMp * 100));
    setText('shopHpText', `${state.hp} / ${state.maxHp}`);
    setText('shopMpText', `${state.mp} / ${state.maxMp}`);
    $('shopHpBar').style.width = `${hpPct}%`;
    $('shopMpBar').style.width = `${mpPct}%`;
    setText('shopPotionCount', `× ${state.potions}`);
    setText('shopEtherCount', `× ${state.ethers}`);
  }
  function renderSkillActions() {
    $('actions').querySelectorAll('.class-skill, .learned-skill').forEach(button => button.remove());
    const classProfile = classes[state.classId];
    (classProfile?.skills || []).forEach(id => {
      const skill = classSkills[id];
      if (!skill) return;
      const button = document.createElement('button');
      button.className = 'action-card class-skill';
      button.dataset.action = id;
      button.dataset.menuGroup = 'skills';
      button.innerHTML = `<span class="action-icon ${skill.classId === 'mage' ? 'orange-icon' : skill.classId === 'archer' ? 'green-icon' : 'purple-icon'}">${skill.icon}</span><span class="action-copy"><strong>${skill.name}</strong><small>${skill.info}</small></span><span class="action-cost">${skill.cost} FP</span>`;
      $('actions').appendChild(button);
    });
    state.learnedSkills.forEach(id => {
      const skill = skillBooks.find(book => book.id === id);
      if (!skill) return;
      const button = document.createElement('button');
      button.className = 'action-card learned-skill';
      button.dataset.action = `skill:${skill.id}`;
      button.dataset.menuGroup = 'skills';
      button.innerHTML = `<span class="action-icon purple-icon">${skill.icon}</span><span class="action-copy"><strong>${skill.name}</strong><small>${skill.info}</small></span><span class="action-cost">${skill.cost} FP</span>`;
      $('actions').appendChild(button);
    });
    $('actions').querySelectorAll('[data-menu-group]').forEach(button => {
      button.hidden = button.dataset.menuGroup !== state.menu;
    });
    document.querySelectorAll('.command-tab').forEach(button => {
      const selected = button.dataset.menu === state.menu;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    setText('menuTitle', state.menu.toUpperCase());
    setText('actionHint', state.menu === 'skills' ? 'Class & learned skills' : state.menu === 'items' ? 'Supplies at hand' : state.menu === 'guard' ? 'Brace for the next blow' : 'Choose a move');
  }
  function chooseClass(classId) {
    const profile = classes[classId];
    if (!profile || state.classId) return;
    state.classId = classId;
    state.maxHp = state.hp = profile.hp;
    state.maxMp = state.mp = profile.mp;
    state.power = profile.power;
    state.armor = profile.armor;
    $('classSelect').classList.add('hidden');
    $('playerCombatant').dataset.class = classId;
    document.body.dataset.heroClass = classId;
    setText('heroName', profile.hero);
    setText('heroClass', profile.title);
    setText('classIcon', profile.icon);
    document.querySelector('.art-caption').textContent = profile.name.toUpperCase();
    state.menu = 'fight';
    render();
    log(`${profile.name} selected. Your climb begins!`);
  }
  function render() {
    renderSkillActions();
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
    renderShopStatus();
    setText('goldTop', state.gold);
    setText('floorTop', String(state.floor).padStart(2, '0'));
    setText('towerFloor', String(state.floor).padStart(2, '0'));
    setText('level', `LVL ${String(state.level).padStart(2, '0')}`);
    setText('xpText', `${state.xp} / ${state.level * 40}`);
    setText('progressText', `${state.cleared} ${state.cleared === 1 ? 'floor' : 'floors'} cleared`);
    $('progressBar').style.width = `${Math.max(8, ((state.floor - 1) % 5 + 1) * 20)}%`;
    document.querySelectorAll('.action-card').forEach(button => {
      const action = button.dataset.action;
      const skill = action.startsWith('skill:') ? skillBooks.find(book => book.id === action.slice(6)) : null;
      const classSkill = classSkills[action];
      const cost = classSkill?.cost || skill?.cost || 0;
      button.disabled = !state.classId || state.phase !== 'battle' || state.busy || state.hp <= 0 || state.enemyHp <= 0 || state.mp < cost || (action === 'potion' && (state.potions <= 0 || state.hp === state.maxHp)) || (action === 'ether' && (state.ethers <= 0 || state.mp === state.maxMp)) || ((classSkill?.heal || skill?.heal) && state.hp === state.maxHp);
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
      let burnDamage = 0;
      if (state.burn > 0 && state.enemyHp > 0) {
        burnDamage = Math.min(5, state.enemyHp);
        state.enemyHp = Math.max(0, state.enemyHp - burnDamage);
        state.burn--;
        showFloat(`−${burnDamage} burn`);
      }
      const regenHp = state.hp > 0 ? Math.min(2, state.maxHp - state.hp) : 0;
      const regenMp = Math.min(1, state.maxMp - state.mp);
      state.hp += regenHp;
      state.mp += regenMp;
      if (regenHp) showFloat(`+${regenHp}`, 'heal', true);
      if (regenMp) showFloat(`+${regenMp} FP`, 'heal', true);
      log(`${state.enemy.name} ${heavy ? 'unleashes a heavy strike' : 'strikes'} for ${damage} damage${state.armor ? ` (${state.armor} absorbed)` : ''}.${burnDamage ? ` Burn deals ${burnDamage}.` : ''} Turn’s end: +${regenHp} HP, +${regenMp} FP.`);
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
  function animatePlayer(action, incoming = false) {
    const player = $('playerCombatant');
    const classId = state.classId || 'knight';
    const animation = incoming ? 'player-hit' : `player-${classId}-attack`;
    player.classList.remove('player-hit', 'player-knight-attack', 'player-mage-attack', 'player-archer-attack');
    void player.offsetWidth;
    player.classList.add(animation);
  }
  function doAction(action) {
    if (state.phase !== 'battle' || state.busy || !state.classId) return;
    let damage = 0;
    let turnConsumed = false;
    const classSkill = classSkills[action];
    const book = action.startsWith('skill:') ? skillBooks.find(item => item.id === action.slice(6)) : null;
    if (classSkill) {
      if (!classes[state.classId].skills.includes(action) || state.mp < classSkill.cost || (classSkill.heal && state.hp >= state.maxHp)) return;
      state.mp -= classSkill.cost;
      if (classSkill.heal) {
        const healed = Math.min(classSkill.heal, state.maxHp - state.hp);
        state.hp += healed; showFloat(`+${healed}`, 'heal', true);
      }
      if (classSkill.guard) state.guarding = true;
      if (classSkill.burn) state.burn = classSkill.burn;
      if (classSkill.damage) damage = Math.round(state.power * classSkill.damage + classSkill.bonus + Math.random() * 5);
      log(`${classSkill.name}: ${classSkill.heal ? 'restores your vitality' : 'strikes for ' + damage + ' damage'}${classSkill.guard ? ' and braces for the next strike' : ''}${classSkill.burn ? ' as the foe catches fire' : ''}.`);
      beep(classSkill.classId === 'mage' ? 480 : classSkill.classId === 'archer' ? 390 : 340);
      turnConsumed = true;
    } else if (book) {
      if (!state.learnedSkills.includes(book.id) || state.mp < book.cost || (book.heal && state.hp >= state.maxHp)) return;
      state.mp -= book.cost;
      if (book.heal) {
        const healed = Math.min(book.heal, state.maxHp - state.hp);
        state.hp += healed; showFloat(`+${healed}`, 'heal', true);
      }
      if (book.id === 'aegis') state.guarding = true;
      if (book.damage) damage = Math.round(state.power * book.damage + book.bonus + Math.random() * 7);
      log(book.heal ? `${book.name} restores your vitality${book.id === 'aegis' ? ' and braces you for the next strike' : ''}.` : `${book.name} strikes for ${damage} damage.`);
      beep(610); turnConsumed = true;
    } else {
      switch (action) {
        case 'attack':
          damage = state.power + Math.floor(Math.random() * 5);
          log(`You strike true, dealing ${damage} damage.`); turnConsumed = true; break;
        case 'potion': {
          if (!state.potions || state.hp >= state.maxHp) return;
          state.potions--;
          const healed = Math.min(40, state.maxHp - state.hp); state.hp += healed;
          showFloat(`+${healed}`, 'heal', true); log(`You drink a health potion and recover ${healed} vitality.`); beep(520); turnConsumed = true; break;
        }
        case 'ether': {
          if (!state.ethers || state.mp >= state.maxMp) return;
          state.ethers--;
          const restored = Math.min(20, state.maxMp - state.mp); state.mp += restored;
          showFloat(`+${restored} FP`, 'heal', true); log(`The focus tonic restores ${restored} focus.`); beep(440); turnConsumed = true; break;
        }
        case 'guard':
          state.guarding = true; log('You brace behind your guard. The next hit will deal half damage.'); beep(180); turnConsumed = true; break;
      }
    }
    if (!turnConsumed) return;
    animatePlayer(action);
    if (damage > 0) {
      state.enemyHp = Math.max(0, state.enemyHp - damage);
      showFloat(`−${damage}`);
      const wrap = $('enemyWrap'); wrap.classList.remove('hit'); void wrap.offsetWidth; wrap.classList.add('hit');
      beep(260 + Math.min(250, damage * 4));
    }
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
    renderShopStatus();
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
  function renderTown(selectedId = getTownNpcs()[0]?.id) {
    const townNpcs = getTownNpcs();
    setText('townGold', state.gold);
    $('townNpcs').innerHTML = townNpcs.map(npc => `<button class="town-npc${npc.id === selectedId ? ' selected' : ''}" data-npc="${npc.id}"><span>${npc.icon}</span><strong>${npc.name}</strong><small>${npc.role}</small></button>`).join('');
    $('townNpcs').querySelectorAll('[data-npc]').forEach(button => button.addEventListener('click', () => renderTown(button.dataset.npc)));
    const npc = townNpcs.find(person => person.id === selectedId);
    if (!npc) { $('townContent').innerHTML = '<p>There is no one here just now.</p>'; return; }
    if (npc.type === 'class-specialist') {
      $('townContent').innerHTML = `<div class="panel-kicker">${classes[state.classId].name.toUpperCase()} TECHNIQUES · SKILL BOOKS</div><h3>${npc.name}</h3><p>${npc.greeting}</p><div class="skill-book-list">${skillBooks.filter(book => book.classId === state.classId).map(book => {
        const learned = state.learnedSkills.includes(book.id);
        return `<article class="skill-book"><span class="skill-book-icon">${book.icon}</span><div><strong>${book.name}</strong><small>${book.info} · ${book.cost} FP in battle</small></div><button class="buy-btn" data-skill-book="${book.id}" ${learned || state.gold < book.price ? 'disabled' : ''}>${learned ? 'LEARNED' : `◉ ${book.price}`}</button></article>`;
      }).join('')}</div>`;
      $('townContent').querySelectorAll('[data-skill-book]').forEach(button => button.addEventListener('click', () => buySkillBook(button.dataset.skillBook)));
    } else {
      $('townContent').innerHTML = `<div class="panel-kicker">${npc.role.toUpperCase()}</div><h3>${npc.name}</h3><p>${npc.greeting || 'This town resident has nothing to offer just yet.'}</p>`;
    }
  }
  function buySkillBook(id) {
    const book = skillBooks.find(item => item.id === id);
    if (!book || state.gold < book.price || state.learnedSkills.includes(id)) return;
    state.gold -= book.price;
    state.learnedSkills.push(id);
    renderTown(getTownNpcs()[0]?.id);
    render();
    log(`${book.name} learned. Its skill is now available in battle.`);
  }
  function visitTown() {
    $('shopModal').classList.add('hidden');
    renderTown();
    $('townModal').classList.remove('hidden');
  }
  function returnToMerchant() {
    $('townModal').classList.add('hidden');
    $('shopModal').classList.remove('hidden');
    renderShop();
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
    $('shopModal').classList.add('hidden'); $('townModal').classList.add('hidden'); $('gameOverModal').classList.add('hidden');
    $('classSelect').classList.remove('hidden');
    $('playerCombatant').dataset.class = 'knight';
    document.body.dataset.heroClass = '';
    setText('heroName', 'Choose a hero');
    setText('heroClass', 'Awaiting your path');
    setText('classIcon', '✦');
    $('journal').innerHTML = '<div class="journal-item current"><span>01</span><div><strong>The Spire’s threshold</strong><small>Where the ascent begins</small></div><i>●</i></div><div class="journal-item locked"><span>02</span><div><strong>Unknown heights</strong><small>Keep climbing to reveal</small></div><i>◌</i></div><div class="journal-item locked"><span>03</span><div><strong>Unknown heights</strong><small>Keep climbing to reveal</small></div><i>◌</i></div>';
    makeEnemy();
  }
  $('actions').addEventListener('click', event => {
    const button = event.target.closest('.action-card');
    if (button && !button.disabled) doAction(button.dataset.action);
  });
  document.querySelectorAll('[data-class-choice]').forEach(button => button.addEventListener('click', () => chooseClass(button.dataset.classChoice)));
  document.querySelectorAll('.command-tab').forEach(button => button.addEventListener('click', () => {
    state.menu = button.dataset.menu;
    renderSkillActions();
  }));
  $('continueBtn').addEventListener('click', continueClimb);
  $('townBtn').addEventListener('click', visitTown);
  $('townReturnBtn').addEventListener('click', returnToMerchant);
  $('retryBtn').addEventListener('click', reset);
  $('resetBtn').addEventListener('click', () => { if (window.confirm('Start a new run? Your current climb will end.')) reset(); });
  $('soundBtn').addEventListener('click', () => { soundOn = !soundOn; $('soundBtn').textContent = soundOn ? '♫' : '♪'; $('soundBtn').classList.toggle('sound-on', soundOn); if (soundOn) beep(440); });
  makeEnemy();
})();
