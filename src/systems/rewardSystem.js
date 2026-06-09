import { DATA, RARITIES, STAT_LABELS } from "../data/content.js";
import { sample, rand } from "../core/utils.js";

/**
 * 生成突破奖励三选一
 * 根据当前年份和进度，混合不同类型的奖励
 */
export function buildRewardChoices(run) {
  const choices = [];
  const usedIndices = new Set();

  // 确保三种不同类型的奖励
  const types = ["trait", "skill", "weapon", "armor", "internalArt", "item"];
  const selectedTypes = sample(types, 3);

  for (const type of selectedTypes) {
    let option = null;
    switch (type) {
      case "trait":
        option = buildTraitReward(run);
        break;
      case "skill":
        option = buildSkillReward(run);
        break;
      case "weapon":
        option = buildWeaponReward(run);
        break;
      case "armor":
        option = buildArmorReward(run);
        break;
      case "internalArt":
        option = buildInternalArtReward(run);
        break;
      case "item":
        option = buildItemReward(run);
        break;
    }
    if (option) choices.push(option);
  }

  // 如果奖励不足3个，用特性补足
  while (choices.length < 3) {
    const extra = buildTraitReward(run);
    if (extra) choices.push(extra);
    else break;
  }

  return choices.slice(0, 3);
}

function buildTraitReward(run) {
  const available = DATA.traits.filter(t =>
    !run.traits.includes(t.id) && !run.skillTraits.some(st => st.id === t.id)
    // 孤云线：排除其他剧情线的专属特性
    && !(run.storylineId === "wanderer" && ["constable", "orthodox"].includes(t.id))
  );
  if (!available.length) return null;
  const trait = sample(available, 1)[0];
  return {
    kind: "trait",
    type: "特性",
    icon: "特",
    name: trait.name,
    desc: trait.desc,
    data: trait
  };
}

function buildSkillReward(run) {
  // 孤云线限定：只从专属秘籍池中抽取
  const wandererSkillIds = run.storylineId === "wanderer"
    ? (DATA.wandererMerchantPool?.manuals || []).map(m => m.id)
    : null;

  // 优先给当前流派的秘籍，其次给通用秘籍
  const available = Object.keys(DATA.skills || {}).filter(id => {
    const s = DATA.skills[id];
    if (!s) return false;
    if (run.skills.includes(id)) return false;
    if (run.trainingSkills.includes(id)) return false;
    if (RARITIES[s.rarity].year > run.year) return false;
    // 孤云线：只保留专属池中的秘籍
    if (wandererSkillIds && !wandererSkillIds.includes(id)) return false;
    return true;
  });

  if (!available.length) return null;

  // 优先选择当前流派的
  const schoolMatches = available.filter(id => DATA.skills[id].school === run.selectedSchool);
  const pool = schoolMatches.length ? schoolMatches : available;
  const skillId = sample(pool, 1)[0];
  const skill = DATA.skills[skillId];

  return {
    kind: "skill",
    type: "武学秘籍",
    icon: skill.icon || "秘",
    name: skill.name,
    desc: `${DATA.SCHOOLS[skill.school]?.name || "武学"}·${skill.tierName || ""}：${skill.desc}`,
    data: { id: skillId, ...skill }
  };
}

function buildWeaponReward(run) {
  // 孤云线限定：只从专属武器池中抽取
  const wandererWeaponIds = run.storylineId === "wanderer"
    ? (DATA.wandererMerchantPool?.weapons || []).map(w => w.id)
    : null;

  const available = Object.values(DATA.weapons || {}).filter(w => {
    if (run.weapons.includes(w.id)) return false;
    if (RARITIES[w.rarity].year > run.year) return false;
    // 孤云线：只保留专属池中的武器
    if (wandererWeaponIds && !wandererWeaponIds.includes(w.id)) return false;
    return true;
  });

  if (!available.length) return null;

  // 优先选择当前流派的武器
  const schoolMatches = run.selectedSchool
    ? available.filter(w => w.school === run.selectedSchool)
    : available;
  const pool = schoolMatches.length ? schoolMatches : available;
  const weapon = sample(pool, 1)[0];

  return {
    kind: "weapon",
    type: "武器",
    icon: weapon.icon || "刀",
    name: weapon.name,
    desc: `${weapon.desc}（攻击+${weapon.atk}）`,
    data: weapon
  };
}

function buildArmorReward(run) {
  // 孤云线限定：只从专属防具池中抽取
  const wandererArmorIds = run.storylineId === "wanderer"
    ? (DATA.wandererMerchantPool?.armors || []).map(a => a.id)
    : null;

  const available = Object.values(DATA.armors || {}).filter(a => {
    if (run.armors.includes(a.id)) return false;
    if (RARITIES[a.rarity].year > run.year) return false;
    // 孤云线：只保留专属池中的防具
    if (wandererArmorIds && !wandererArmorIds.includes(a.id)) return false;
    return true;
  });

  if (!available.length) return null;

  const armor = sample(available, 1)[0];
  return {
    kind: "armor",
    type: "防具",
    icon: armor.icon || "甲",
    name: armor.name,
    desc: `${armor.desc}（血量+${armor.hp}，防御+${armor.def}）`,
    data: armor
  };
}

function buildInternalArtReward(run) {
  // 孤云线限定：只从专属内功池中抽取
  const wandererArtIds = run.storylineId === "wanderer"
    ? (DATA.wandererMerchantPool?.internalArts || []).map(a => a.id)
    : null;

  const available = Object.values(DATA.internalArts || {}).filter(a => {
    if (run.internalArts.includes(a.id)) return false;
    if (RARITIES[a.rarity].year > run.year) return false;
    // 孤云线：只保留专属池中的内功
    if (wandererArtIds && !wandererArtIds.includes(a.id)) return false;
    return true;
  });

  if (!available.length) return null;

  const art = sample(available, 1)[0];
  return {
    kind: "internalArt",
    type: "内功心法",
    icon: art.icon || "内",
    name: art.name,
    desc: art.desc,
    data: art
  };
}

function buildItemReward(run) {
  const itemKeys = Object.keys(DATA.items || {});
  if (!itemKeys.length) return null;

  const id = sample(itemKeys, 1)[0];
  const item = DATA.items[id];
  return {
    kind: "item",
    type: "丹药",
    icon: item.icon || "药",
    name: item.name,
    desc: item.desc,
    data: { id, ...item }
  };
}

/**
 * 领取突破奖励
 */
export function takeReward(run, option) {
  if (!option || !option.kind) {
    return "突破奖励已领取。";
  }

  switch (option.kind) {
    case "trait":
      return takeTraitReward(run, option);

    case "skill":
      return takeSkillReward(run, option);

    case "weapon":
      return takeWeaponReward(run, option);

    case "armor":
      return takeArmorReward(run, option);

    case "internalArt":
      return takeInternalArtReward(run, option);

    case "item":
      return takeItemReward(run, option);

    default:
      return "突破奖励已领取。";
  }
}

function takeTraitReward(run, option) {
  const trait = option.data;
  if (!run.traits.includes(trait.id)) {
    run.traits.push(trait.id);
  }
  return `突破奖励：获得特性「${trait.name}」——${trait.desc}`;
}

function takeSkillReward(run, option) {
  const skillId = option.data.id;
  if (run.skills.includes(skillId)) {
    return `已经掌握《${option.data.name}》，奖励转化为武学阅历+200。`;
  }
  if (run.trainingSkills.includes(skillId)) {
    // 加速修炼进度
    run.skillProgress[skillId] = (run.skillProgress[skillId] || 0) + 2;
    return `突破奖励：秘籍《${option.data.name}》修炼进度+2。`;
  }
  // 直接加入修炼列表
  run.trainingSkills.push(skillId);
  return `突破奖励：获得秘籍《${option.data.name}》，已开始修炼。`;
}

function takeWeaponReward(run, option) {
  const weapon = option.data;
  if (!run.weapons.includes(weapon.id)) {
    run.weapons.push(weapon.id);
  }
  // 自动装备更好的武器
  autoEquipWeapon(run);
  return `突破奖励：获得武器「${weapon.name}」。`;
}

function takeArmorReward(run, option) {
  const armor = option.data;
  if (!run.armors.includes(armor.id)) {
    run.armors.push(armor.id);
  }
  // 自动装备更好的防具
  autoEquipArmor(run);
  return `突破奖励：获得防具「${armor.name}」。`;
}

function takeInternalArtReward(run, option) {
  const art = option.data;
  if (!run.internalArts.includes(art.id)) {
    run.internalArts.push(art.id);
    // 立即获得属性加成
    for (const [key, value] of Object.entries(art.statGain || {})) {
      run.stats[key] = Number(((run.stats[key] || 0) + value).toFixed(2));
    }
    run.hp = Math.min(run.hp + (art.statGain?.hp || 0), run.stats.hp);
    run.qi = Math.min(run.qi + (art.statGain?.qi || 0), run.stats.qi);
  }
  return `突破奖励：获得内功《${art.name}》。${art.desc}`;
}

function takeItemReward(run, option) {
  const item = option.data;
  run.items.push(item.id);
  return `突破奖励：获得${item.name}x1。`;
}

/**
 * 自动装备更好的武器
 */
function autoEquipWeapon(run) {
  if (!run.equippedWeapon) {
    // 没有装备武器，装备第一个
    if (run.weapons.length) {
      run.equippedWeapon = run.weapons[0];
    }
    return;
  }

  // 比较当前装备和新武器，选择更好的
  const current = DATA.weapons[run.equippedWeapon];
  let bestWeapon = current;
  let bestId = run.equippedWeapon;

  for (const id of run.weapons) {
    const w = DATA.weapons[id];
    if (!w) continue;
    if (!bestWeapon || w.atk > bestWeapon.atk || RARITIES[w.rarity].rank > RARITIES[bestWeapon.rarity].rank) {
      bestWeapon = w;
      bestId = id;
    }
  }

  run.equippedWeapon = bestId;
}

/**
 * 自动装备更好的防具
 */
function autoEquipArmor(run) {
  if (!run.equippedArmor) {
    if (run.armors.length) {
      run.equippedArmor = run.armors[0];
    }
    return;
  }

  const current = DATA.armors[run.equippedArmor];
  let bestArmor = current;
  let bestId = run.equippedArmor;

  for (const id of run.armors) {
    const a = DATA.armors[id];
    if (!a) continue;
    const currentValue = (bestArmor?.hp || 0) + (bestArmor?.def || 0) * 10;
    const newValue = (a.hp || 0) + (a.def || 0) * 10;
    if (newValue > currentValue || RARITIES[a.rarity].rank > RARITIES[bestArmor?.rarity || "blue"].rank) {
      bestArmor = a;
      bestId = id;
    }
  }

  run.equippedArmor = bestId;
}
