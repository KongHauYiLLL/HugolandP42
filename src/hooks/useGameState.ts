import { useState, useEffect, useCallback } from 'react';
import { GameState, Weapon, Armor, Enemy, ChestReward, RelicItem, AdventureSkill, MenuSkill, MerchantReward } from '../types/game';
import { generateWeapon, generateArmor, generateEnemy, generateRelicItem, getChestRarityWeights } from '../utils/gameUtils';
import { checkAchievements, initializeAchievements } from '../utils/achievements';
import { checkPlayerTags, initializePlayerTags } from '../utils/playerTags';
import AsyncStorage from '../utils/storage';

const STORAGE_KEY = 'hugoland_game_state';

// Adventure skill definitions
const adventureSkillDefinitions: Omit<AdventureSkill, 'id'>[] = [
  {
    name: 'Risker',
    description: 'Gain +50% HP but take +25% damage',
    type: 'risker'
  },
  {
    name: 'Lightning Chain',
    description: 'Correct answers deal damage to next enemy too',
    type: 'lightning_chain'
  },
  {
    name: 'Skip Card',
    description: 'Skip one question and automatically get it right',
    type: 'skip_card'
  },
  {
    name: 'Metal Shield',
    description: 'Block the first enemy attack completely',
    type: 'metal_shield'
  },
  {
    name: 'Truth & Lies',
    description: 'Remove one wrong answer from multiple choice questions',
    type: 'truth_lies'
  },
  {
    name: 'Ramp',
    description: 'Each correct answer increases damage by 10%',
    type: 'ramp'
  },
  {
    name: 'Dodge',
    description: '50% chance to avoid enemy attacks',
    type: 'dodge'
  },
  {
    name: 'Berserker',
    description: '+100% damage but -50% defense',
    type: 'berserker'
  },
  {
    name: 'Vampiric',
    description: 'Heal 25% of damage dealt',
    type: 'vampiric'
  },
  {
    name: 'Phoenix',
    description: 'Revive once with 50% HP when defeated',
    type: 'phoenix'
  },
  {
    name: 'Time Slow',
    description: '+50% time to answer questions',
    type: 'time_slow'
  },
  {
    name: 'Critical Strike',
    description: '25% chance to deal double damage',
    type: 'critical_strike'
  },
  {
    name: 'Shield Wall',
    description: 'Reduce all damage taken by 50%',
    type: 'shield_wall'
  },
  {
    name: 'Poison Blade',
    description: 'Attacks poison enemies for 3 turns',
    type: 'poison_blade'
  },
  {
    name: 'Arcane Shield',
    description: 'Immune to damage for first 3 attacks',
    type: 'arcane_shield'
  },
  {
    name: 'Battle Frenzy',
    description: 'Attack speed increases with each correct answer',
    type: 'battle_frenzy'
  },
  {
    name: 'Elemental Mastery',
    description: 'Deal bonus damage based on question category',
    type: 'elemental_mastery'
  },
  {
    name: 'Shadow Step',
    description: 'First wrong answer doesn\'t count',
    type: 'shadow_step'
  },
  {
    name: 'Healing Aura',
    description: 'Regenerate 10% HP each turn',
    type: 'healing_aura'
  },
  {
    name: 'Double Strike',
    description: 'Each attack hits twice',
    type: 'double_strike'
  },
  {
    name: 'Mana Shield',
    description: 'Convert 50% damage to mana cost',
    type: 'mana_shield'
  },
  {
    name: 'Berserk Rage',
    description: 'Damage increases as HP decreases',
    type: 'berserk_rage'
  },
  {
    name: 'Divine Protection',
    description: 'Cannot die for 5 turns',
    type: 'divine_protection'
  },
  {
    name: 'Storm Call',
    description: 'Lightning strikes random enemies',
    type: 'storm_call'
  },
  {
    name: 'Blood Pact',
    description: 'Sacrifice HP for massive damage',
    type: 'blood_pact'
  }
];

const generateYojefMarketItems = (): RelicItem[] => {
  const items: RelicItem[] = [];
  const itemCount = 3 + Math.floor(Math.random() * 3); // 3-5 items
  
  for (let i = 0; i < itemCount; i++) {
    items.push(generateRelicItem());
  }
  
  return items;
};

const createInitialGameState = (): GameState => ({
  coins: 500,
  gems: 50,
  shinyGems: 0,
  zone: 1,
  playerStats: {
    hp: 100,
    maxHp: 100,
    atk: 20,
    def: 10,
    baseAtk: 20,
    baseDef: 10,
    baseHp: 100
  },
  inventory: {
    weapons: [],
    armor: [],
    relics: [],
    currentWeapon: null,
    currentArmor: null,
    equippedRelics: []
  },
  currentEnemy: null,
  inCombat: false,
  combatLog: [],
  isPremium: false,
  achievements: initializeAchievements(),
  collectionBook: {
    weapons: {},
    armor: {},
    totalWeaponsFound: 0,
    totalArmorFound: 0,
    rarityStats: {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythical: 0
    }
  },
  knowledgeStreak: {
    current: 0,
    best: 0,
    multiplier: 1
  },
  gameMode: {
    current: 'normal',
    speedModeActive: false,
    survivalLives: 3,
    maxSurvivalLives: 3
  },
  statistics: {
    totalQuestionsAnswered: 0,
    correctAnswers: 0,
    totalPlayTime: 0,
    zonesReached: 1,
    itemsCollected: 0,
    coinsEarned: 0,
    gemsEarned: 0,
    shinyGemsEarned: 0,
    chestsOpened: 0,
    accuracyByCategory: {},
    sessionStartTime: new Date(),
    totalDeaths: 0,
    totalVictories: 0,
    longestStreak: 0,
    fastestVictory: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    itemsUpgraded: 0,
    itemsSold: 0,
    totalResearchSpent: 0,
    averageAccuracy: 0,
    revivals: 0
  },
  cheats: {
    infiniteCoins: false,
    infiniteGems: false,
    obtainAnyItem: false
  },
  mining: {
    totalGemsMined: 0,
    totalShinyGemsMined: 0
  },
  yojefMarket: {
    items: generateYojefMarketItems(),
    lastRefresh: new Date(),
    nextRefresh: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
  },
  playerTags: initializePlayerTags(),
  dailyRewards: {
    lastClaimDate: null,
    currentStreak: 0,
    maxStreak: 0,
    availableReward: null,
    rewardHistory: []
  },
  progression: {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    skillPoints: 0,
    unlockedSkills: [],
    prestigeLevel: 0,
    prestigePoints: 0,
    masteryLevels: {}
  },
  offlineProgress: {
    lastSaveTime: new Date(),
    offlineCoins: 0,
    offlineGems: 0,
    offlineTime: 0,
    maxOfflineHours: 24
  },
  gardenOfGrowth: {
    isPlanted: false,
    plantedAt: null,
    lastWatered: null,
    waterHoursRemaining: 0,
    growthCm: 0,
    totalGrowthBonus: 0,
    seedCost: 1000,
    waterCost: 1000,
    maxGrowthCm: 100
  },
  settings: {
    colorblindMode: false,
    darkMode: true,
    language: 'en',
    notifications: true,
    snapToGrid: false,
    beautyMode: false
  },
  hasUsedRevival: false,
  skills: {
    activeMenuSkill: null,
    lastRollTime: null,
    playTimeThisSession: 0,
    sessionStartTime: new Date()
  },
  adventureSkills: {
    selectedSkill: null,
    availableSkills: [],
    showSelectionModal: false,
    skillEffects: {
      skipCardUsed: false,
      metalShieldUsed: false,
      dodgeUsed: false,
      truthLiesActive: false,
      lightningChainActive: false,
      rampActive: false,
      berserkerActive: false,
      vampiricActive: false,
      phoenixUsed: false,
      timeSlowActive: false,
      criticalStrikeActive: false,
      shieldWallActive: false,
      poisonBladeActive: false,
      arcaneShieldActive: false,
      battleFrenzyActive: false,
      elementalMasteryActive: false,
      shadowStepUsed: false,
      healingAuraActive: false,
      doubleStrikeActive: false,
      manaShieldActive: false,
      berserkRageActive: false,
      divineProtectionUsed: false,
      stormCallActive: false,
      bloodPactActive: false,
      frostArmorActive: false,
      fireballActive: false
    }
  },
  research: {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    totalSpent: 0,
    bonuses: {
      atk: 0,
      def: 0,
      hp: 0,
      coinMultiplier: 1,
      gemMultiplier: 1,
      xpMultiplier: 1
    }
  },
  multipliers: {
    coins: 1,
    gems: 1,
    atk: 1,
    def: 1,
    hp: 1
  },
  merchant: {
    hugollandFragments: 0,
    totalFragmentsEarned: 0,
    lastFragmentZone: 0,
    showRewardModal: false,
    availableRewards: []
  }
});

const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load game state from storage
  useEffect(() => {
    const loadGameState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          // Ensure all required properties exist
          const completeState = { ...createInitialGameState(), ...parsedState };
          
          // Initialize Yojef Market if empty
          if (!completeState.yojefMarket.items || completeState.yojefMarket.items.length === 0) {
            completeState.yojefMarket.items = generateYojefMarketItems();
          }
          
          setGameState(completeState);
        } else {
          setGameState(createInitialGameState());
        }
      } catch (error) {
        console.error('Error loading game state:', error);
        setGameState(createInitialGameState());
      } finally {
        setIsLoading(false);
      }
    };

    loadGameState();
  }, []);

  // Auto-refresh Yojef Market every 5 minutes
  useEffect(() => {
    if (!gameState) return;

    const checkMarketRefresh = () => {
      const now = new Date();
      if (now >= new Date(gameState.yojefMarket.nextRefresh)) {
        updateGameState(state => ({
          ...state,
          yojefMarket: {
            ...state.yojefMarket,
            items: generateYojefMarketItems(),
            lastRefresh: now,
            nextRefresh: new Date(now.getTime() + 5 * 60 * 1000)
          }
        }));
      }
    };

    const interval = setInterval(checkMarketRefresh, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [gameState]);

  // Save game state to storage
  const saveGameState = useCallback(async (state: GameState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }, []);

  // Auto-save when game state changes
  useEffect(() => {
    if (gameState && !isLoading) {
      saveGameState(gameState);
    }
  }, [gameState, isLoading, saveGameState]);

  const updateGameState = useCallback((updater: (state: GameState) => GameState) => {
    setGameState(prevState => {
      if (!prevState) return null;
      return updater(prevState);
    });
  }, []);

  // Generate random adventure skills for selection
  const generateAdventureSkills = useCallback((): AdventureSkill[] => {
    const shuffled = [...adventureSkillDefinitions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map((skill, index) => ({
      ...skill,
      id: `skill_${Date.now()}_${index}`
    }));
  }, []);

  // Game actions
  const equipWeapon = useCallback((weapon: Weapon) => {
    updateGameState(state => ({
      ...state,
      inventory: {
        ...state.inventory,
        currentWeapon: weapon
      }
    }));
  }, [updateGameState]);

  const equipArmor = useCallback((armor: Armor) => {
    updateGameState(state => ({
      ...state,
      inventory: {
        ...state.inventory,
        currentArmor: armor
      }
    }));
  }, [updateGameState]);

  const upgradeWeapon = useCallback((weaponId: string) => {
    updateGameState(state => {
      if (state.gems < 10) return state; // Not enough gems
      
      const weaponIndex = state.inventory.weapons.findIndex(w => w.id === weaponId);
      if (weaponIndex === -1) return state;

      const weapon = state.inventory.weapons[weaponIndex];
      const upgradedWeapon = {
        ...weapon,
        level: weapon.level + 1,
        baseAtk: weapon.baseAtk + 10,
        upgradeCost: Math.floor(weapon.upgradeCost * 1.5)
      };

      const newWeapons = [...state.inventory.weapons];
      newWeapons[weaponIndex] = upgradedWeapon;

      return {
        ...state,
        gems: state.gems - weapon.upgradeCost,
        inventory: {
          ...state.inventory,
          weapons: newWeapons,
          currentWeapon: state.inventory.currentWeapon?.id === weaponId ? upgradedWeapon : state.inventory.currentWeapon
        }
      };
    });
  }, [updateGameState]);

  const upgradeArmor = useCallback((armorId: string) => {
    updateGameState(state => {
      if (state.gems < 10) return state; // Not enough gems
      
      const armorIndex = state.inventory.armor.findIndex(a => a.id === armorId);
      if (armorIndex === -1) return state;

      const armor = state.inventory.armor[armorIndex];
      const upgradedArmor = {
        ...armor,
        level: armor.level + 1,
        baseDef: armor.baseDef + 5,
        upgradeCost: Math.floor(armor.upgradeCost * 1.5)
      };

      const newArmor = [...state.inventory.armor];
      newArmor[armorIndex] = upgradedArmor;

      return {
        ...state,
        gems: state.gems - armor.upgradeCost,
        inventory: {
          ...state.inventory,
          armor: newArmor,
          currentArmor: state.inventory.currentArmor?.id === armorId ? upgradedArmor : state.inventory.currentArmor
        }
      };
    });
  }, [updateGameState]);

  const sellWeapon = useCallback((weaponId: string) => {
    updateGameState(state => {
      const weapon = state.inventory.weapons.find(w => w.id === weaponId);
      if (!weapon || state.inventory.currentWeapon?.id === weaponId) return state;

      return {
        ...state,
        coins: state.coins + weapon.sellPrice,
        inventory: {
          ...state.inventory,
          weapons: state.inventory.weapons.filter(w => w.id !== weaponId)
        }
      };
    });
  }, [updateGameState]);

  const sellArmor = useCallback((armorId: string) => {
    updateGameState(state => {
      const armor = state.inventory.armor.find(a => a.id === armorId);
      if (!armor || state.inventory.currentArmor?.id === armorId) return state;

      return {
        ...state,
        coins: state.coins + armor.sellPrice,
        inventory: {
          ...state.inventory,
          armor: state.inventory.armor.filter(a => a.id !== armorId)
        }
      };
    });
  }, [updateGameState]);

  const openChest = useCallback((cost: number): ChestReward | null => {
    if (!gameState || gameState.coins < cost) return null;

    const weights = getChestRarityWeights(cost);
    const random = Math.random() * 100;
    let rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical' = 'common';
    let cumulative = 0;

    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        rarity = ['common', 'rare', 'epic', 'legendary', 'mythical'][i] as any;
        break;
      }
    }

    const isWeapon = Math.random() < 0.5;
    const item = isWeapon ? generateWeapon(false, rarity) : generateArmor(false, rarity);

    updateGameState(state => ({
      ...state,
      coins: state.coins - cost,
      gems: state.gems + Math.floor(Math.random() * 10) + 5,
      inventory: {
        ...state.inventory,
        weapons: isWeapon ? [...state.inventory.weapons, item as Weapon] : state.inventory.weapons,
        armor: !isWeapon ? [...state.inventory.armor, item as Armor] : state.inventory.armor
      },
      statistics: {
        ...state.statistics,
        chestsOpened: state.statistics.chestsOpened + 1,
        itemsCollected: state.statistics.itemsCollected + 1
      }
    }));

    return {
      type: isWeapon ? 'weapon' : 'armor',
      items: [item]
    };
  }, [gameState, updateGameState]);

  const purchaseMythical = useCallback((cost: number): boolean => {
    if (!gameState || gameState.coins < cost) return false;

    const isWeapon = Math.random() < 0.5;
    const item = isWeapon ? generateWeapon(false, 'mythical') : generateArmor(false, 'mythical');

    updateGameState(state => ({
      ...state,
      coins: state.coins - cost,
      inventory: {
        ...state.inventory,
        weapons: isWeapon ? [...state.inventory.weapons, item as Weapon] : state.inventory.weapons,
        armor: !isWeapon ? [...state.inventory.armor, item as Armor] : state.inventory.armor
      }
    }));

    return true;
  }, [gameState, updateGameState]);

  const startCombat = useCallback(() => {
    if (!gameState) return;

    // Show adventure skill selection modal (30% chance)
    if (Math.random() < 0.3) {
      const availableSkills = generateAdventureSkills();
      updateGameState(state => ({
        ...state,
        adventureSkills: {
          ...state.adventureSkills,
          availableSkills,
          showSelectionModal: true,
          selectedSkill: null,
          skillEffects: {
            skipCardUsed: false,
            metalShieldUsed: false,
            dodgeUsed: false,
            truthLiesActive: false,
            lightningChainActive: false,
            rampActive: false,
            berserkerActive: false,
            vampiricActive: false,
            phoenixUsed: false,
            timeSlowActive: false,
            criticalStrikeActive: false,
            shieldWallActive: false,
            poisonBladeActive: false,
            arcaneShieldActive: false,
            battleFrenzyActive: false,
            elementalMasteryActive: false,
            shadowStepUsed: false,
            healingAuraActive: false,
            doubleStrikeActive: false,
            manaShieldActive: false,
            berserkRageActive: false,
            divineProtectionUsed: false,
            stormCallActive: false,
            bloodPactActive: false,
            frostArmorActive: false,
            fireballActive: false
          }
        }
      }));
      return;
    }

    // Start combat normally
    const enemy = generateEnemy(gameState.zone);
    updateGameState(state => ({
      ...state,
      currentEnemy: enemy,
      inCombat: true,
      combatLog: [`You encounter a ${enemy.name} in Zone ${enemy.zone}!`],
      adventureSkills: {
        ...state.adventureSkills,
        selectedSkill: null,
        skillEffects: {
          skipCardUsed: false,
          metalShieldUsed: false,
          dodgeUsed: false,
          truthLiesActive: false,
          lightningChainActive: false,
          rampActive: false,
          berserkerActive: false,
          vampiricActive: false,
          phoenixUsed: false,
          timeSlowActive: false,
          criticalStrikeActive: false,
          shieldWallActive: false,
          poisonBladeActive: false,
          arcaneShieldActive: false,
          battleFrenzyActive: false,
          elementalMasteryActive: false,
          shadowStepUsed: false,
          healingAuraActive: false,
          doubleStrikeActive: false,
          manaShieldActive: false,
          berserkRageActive: false,
          divineProtectionUsed: false,
          stormCallActive: false,
          bloodPactActive: false,
          frostArmorActive: false,
          fireballActive: false
        }
      }
    }));
  }, [gameState, updateGameState, generateAdventureSkills]);

  const attack = useCallback((hit: boolean, category?: string) => {
    if (!gameState || !gameState.currentEnemy) return;

    updateGameState(state => {
      if (!state.currentEnemy) return state;

      let newState = { ...state };
      const enemy = { ...state.currentEnemy };
      const log = [...state.combatLog];

      // Update statistics
      newState.statistics = {
        ...state.statistics,
        totalQuestionsAnswered: state.statistics.totalQuestionsAnswered + 1
      };

      if (category) {
        if (!newState.statistics.accuracyByCategory[category]) {
          newState.statistics.accuracyByCategory[category] = { correct: 0, total: 0 };
        }
        newState.statistics.accuracyByCategory[category].total += 1;
      }

      if (hit) {
        // Player hits enemy
        const damage = Math.max(1, state.playerStats.atk - enemy.def);
        enemy.hp = Math.max(0, enemy.hp - damage);
        log.push(`You deal ${damage} damage to the ${enemy.name}!`);

        // Update knowledge streak
        newState.knowledgeStreak = {
          ...state.knowledgeStreak,
          current: state.knowledgeStreak.current + 1,
          best: Math.max(state.knowledgeStreak.best, state.knowledgeStreak.current + 1),
          multiplier: 1 + (state.knowledgeStreak.current + 1) * 0.1
        };

        newState.statistics.correctAnswers += 1;
        if (category) {
          newState.statistics.accuracyByCategory[category].correct += 1;
        }

        if (enemy.hp <= 0) {
          // Enemy defeated
          const coinReward = Math.floor((50 + state.zone * 10) * newState.knowledgeStreak.multiplier);
          const gemReward = Math.floor((5 + Math.floor(state.zone / 5)) * newState.knowledgeStreak.multiplier);
          
          log.push(`${enemy.name} defeated! You gain ${coinReward} coins and ${gemReward} gems!`);
          
          newState.coins += coinReward;
          newState.gems += gemReward;
          newState.zone += 1;
          newState.inCombat = false;
          newState.currentEnemy = null;
          newState.statistics.totalVictories += 1;
          newState.statistics.coinsEarned += coinReward;
          newState.statistics.gemsEarned += gemReward;
          newState.statistics.zonesReached = Math.max(newState.statistics.zonesReached, newState.zone);

          // Check for premium unlock
          if (newState.zone >= 50) {
            newState.isPremium = true;
          }

          // Check for Hugoland Fragments (every 5 zones)
          if (newState.zone % 5 === 0 && newState.zone > newState.merchant.lastFragmentZone) {
            newState.merchant.hugollandFragments += 1;
            newState.merchant.totalFragmentsEarned += 1;
            newState.merchant.lastFragmentZone = newState.zone;
            log.push(`🧩 You found a Hugoland Fragment!`);
          }
        }
      } else {
        // Enemy hits player
        const damage = Math.max(1, enemy.atk - state.playerStats.def);
        newState.playerStats.hp = Math.max(0, state.playerStats.hp - damage);
        log.push(`The ${enemy.name} deals ${damage} damage to you!`);

        // Reset knowledge streak
        newState.knowledgeStreak = {
          ...state.knowledgeStreak,
          current: 0,
          multiplier: 1
        };

        if (newState.playerStats.hp <= 0) {
          log.push('You have been defeated!');
          newState.inCombat = false;
          newState.currentEnemy = null;
          newState.statistics.totalDeaths += 1;
        }
      }

      newState.currentEnemy = enemy.hp > 0 ? enemy : null;
      newState.combatLog = log;

      return newState;
    });
  }, [gameState, updateGameState]);

  const resetGame = useCallback(() => {
    const newState = createInitialGameState();
    setGameState(newState);
  }, []);

  const setGameMode = useCallback((mode: 'normal' | 'blitz' | 'bloodlust' | 'survival') => {
    updateGameState(state => ({
      ...state,
      gameMode: {
        ...state.gameMode,
        current: mode,
        survivalLives: mode === 'survival' ? 3 : state.gameMode.survivalLives
      }
    }));
  }, [updateGameState]);

  const toggleCheat = useCallback((cheat: keyof typeof gameState.cheats) => {
    if (!gameState) return;
    
    updateGameState(state => ({
      ...state,
      cheats: {
        ...state.cheats,
        [cheat]: !state.cheats[cheat]
      }
    }));
  }, [gameState, updateGameState]);

  const generateCheatItem = useCallback(() => {
    // Implementation for cheat item generation
  }, []);

  const mineGem = useCallback((x: number, y: number) => {
    const isShiny = Math.random() < 0.05;
    const gemsFound = isShiny ? 0 : 1;
    const shinyGemsFound = isShiny ? 1 : 0;

    updateGameState(state => ({
      ...state,
      gems: state.gems + gemsFound,
      shinyGems: state.shinyGems + shinyGemsFound,
      mining: {
        totalGemsMined: state.mining.totalGemsMined + gemsFound,
        totalShinyGemsMined: state.mining.totalShinyGemsMined + shinyGemsFound
      }
    }));

    return { gems: gemsFound, shinyGems: shinyGemsFound };
  }, [updateGameState]);

  const exchangeShinyGems = useCallback((amount: number): boolean => {
    if (!gameState || gameState.shinyGems < amount) return false;

    updateGameState(state => ({
      ...state,
      shinyGems: state.shinyGems - amount,
      gems: state.gems + (amount * 10)
    }));

    return true;
  }, [gameState, updateGameState]);

  const discardItem = useCallback((itemId: string, type: 'weapon' | 'armor') => {
    updateGameState(state => ({
      ...state,
      inventory: {
        ...state.inventory,
        weapons: type === 'weapon' ? state.inventory.weapons.filter(w => w.id !== itemId) : state.inventory.weapons,
        armor: type === 'armor' ? state.inventory.armor.filter(a => a.id !== itemId) : state.inventory.armor
      }
    }));
  }, [updateGameState]);

  const purchaseRelic = useCallback((relicId: string): boolean => {
    if (!gameState) return false;

    const relic = gameState.yojefMarket.items.find(r => r.id === relicId);
    if (!relic || gameState.gems < relic.cost) return false;

    updateGameState(state => ({
      ...state,
      gems: state.gems - relic.cost,
      inventory: {
        ...state.inventory,
        relics: [...state.inventory.relics, relic],
        equippedRelics: [...state.inventory.equippedRelics, relic]
      },
      yojefMarket: {
        ...state.yojefMarket,
        items: state.yojefMarket.items.filter(r => r.id !== relicId)
      }
    }));

    return true;
  }, [gameState, updateGameState]);

  const upgradeRelic = useCallback((relicId: string): boolean => {
    if (!gameState) return false;

    const relicIndex = gameState.inventory.relics.findIndex(r => r.id === relicId);
    if (relicIndex === -1) return false;

    const relic = gameState.inventory.relics[relicIndex];
    if (gameState.gems < relic.upgradeCost) return false;

    updateGameState(state => {
      const newRelics = [...state.inventory.relics];
      const upgradedRelic = {
        ...relic,
        level: relic.level + 1,
        baseAtk: relic.baseAtk ? relic.baseAtk + 22 : undefined,
        baseDef: relic.baseDef ? relic.baseDef + 15 : undefined,
        upgradeCost: Math.floor(relic.upgradeCost * 1.5)
      };
      newRelics[relicIndex] = upgradedRelic;

      const equippedIndex = state.inventory.equippedRelics.findIndex(r => r.id === relicId);
      const newEquippedRelics = [...state.inventory.equippedRelics];
      if (equippedIndex !== -1) {
        newEquippedRelics[equippedIndex] = upgradedRelic;
      }

      return {
        ...state,
        gems: state.gems - relic.upgradeCost,
        inventory: {
          ...state.inventory,
          relics: newRelics,
          equippedRelics: newEquippedRelics
        }
      };
    });

    return true;
  }, [gameState, updateGameState]);

  const equipRelic = useCallback((relicId: string) => {
    updateGameState(state => {
      const relic = state.inventory.relics.find(r => r.id === relicId);
      if (!relic || state.inventory.equippedRelics.some(r => r.id === relicId)) return state;

      return {
        ...state,
        inventory: {
          ...state.inventory,
          equippedRelics: [...state.inventory.equippedRelics, relic]
        }
      };
    });
  }, [updateGameState]);

  const unequipRelic = useCallback((relicId: string) => {
    updateGameState(state => ({
      ...state,
      inventory: {
        ...state.inventory,
        equippedRelics: state.inventory.equippedRelics.filter(r => r.id !== relicId)
      }
    }));
  }, [updateGameState]);

  const sellRelic = useCallback((relicId: string) => {
    updateGameState(state => {
      const relic = state.inventory.relics.find(r => r.id === relicId);
      if (!relic) return state;

      return {
        ...state,
        gems: state.gems + Math.floor(relic.cost * 0.5),
        inventory: {
          ...state.inventory,
          relics: state.inventory.relics.filter(r => r.id !== relicId),
          equippedRelics: state.inventory.equippedRelics.filter(r => r.id !== relicId)
        }
      };
    });
  }, [updateGameState]);

  const claimDailyReward = useCallback((): boolean => {
    if (!gameState || !gameState.dailyRewards.availableReward) return false;

    const reward = gameState.dailyRewards.availableReward;
    updateGameState(state => ({
      ...state,
      coins: state.coins + reward.coins,
      gems: state.gems + reward.gems,
      dailyRewards: {
        ...state.dailyRewards,
        availableReward: null,
        lastClaimDate: new Date(),
        rewardHistory: [...state.dailyRewards.rewardHistory, { ...reward, claimed: true, claimDate: new Date() }]
      }
    }));

    return true;
  }, [gameState, updateGameState]);

  const upgradeSkill = useCallback((skillId: string): boolean => {
    if (!gameState || gameState.progression.skillPoints < 1) return false;

    updateGameState(state => ({
      ...state,
      progression: {
        ...state.progression,
        skillPoints: state.progression.skillPoints - 1,
        unlockedSkills: [...state.progression.unlockedSkills, skillId]
      }
    }));

    return true;
  }, [gameState, updateGameState]);

  const prestige = useCallback((): boolean => {
    if (!gameState || gameState.progression.level < 50) return false;

    const prestigePoints = Math.floor(gameState.progression.level / 10);
    updateGameState(state => ({
      ...state,
      progression: {
        ...state.progression,
        level: 1,
        experience: 0,
        experienceToNext: 100,
        skillPoints: 0,
        unlockedSkills: [],
        prestigeLevel: state.progression.prestigeLevel + 1,
        prestigePoints: state.progression.prestigePoints + prestigePoints
      }
    }));

    return true;
  }, [gameState, updateGameState]);

  const claimOfflineRewards = useCallback(() => {
    updateGameState(state => ({
      ...state,
      coins: state.coins + state.offlineProgress.offlineCoins,
      gems: state.gems + state.offlineProgress.offlineGems,
      offlineProgress: {
        ...state.offlineProgress,
        offlineCoins: 0,
        offlineGems: 0,
        offlineTime: 0
      }
    }));
  }, [updateGameState]);

  const bulkSell = useCallback((itemIds: string[], type: 'weapon' | 'armor') => {
    updateGameState(state => {
      let totalValue = 0;
      let newWeapons = [...state.inventory.weapons];
      let newArmor = [...state.inventory.armor];

      if (type === 'weapon') {
        itemIds.forEach(id => {
          const weapon = newWeapons.find(w => w.id === id);
          if (weapon && state.inventory.currentWeapon?.id !== id) {
            totalValue += weapon.sellPrice;
            newWeapons = newWeapons.filter(w => w.id !== id);
          }
        });
      } else {
        itemIds.forEach(id => {
          const armor = newArmor.find(a => a.id === id);
          if (armor && state.inventory.currentArmor?.id !== id) {
            totalValue += armor.sellPrice;
            newArmor = newArmor.filter(a => a.id !== id);
          }
        });
      }

      return {
        ...state,
        coins: state.coins + totalValue,
        inventory: {
          ...state.inventory,
          weapons: newWeapons,
          armor: newArmor
        }
      };
    });
  }, [updateGameState]);

  const bulkUpgrade = useCallback((itemIds: string[], type: 'weapon' | 'armor') => {
    updateGameState(state => {
      let totalCost = 0;
      let newWeapons = [...state.inventory.weapons];
      let newArmor = [...state.inventory.armor];

      if (type === 'weapon') {
        itemIds.forEach(id => {
          const weaponIndex = newWeapons.findIndex(w => w.id === id);
          if (weaponIndex !== -1) {
            const weapon = newWeapons[weaponIndex];
            totalCost += weapon.upgradeCost;
            newWeapons[weaponIndex] = {
              ...weapon,
              level: weapon.level + 1,
              baseAtk: weapon.baseAtk + 10,
              upgradeCost: Math.floor(weapon.upgradeCost * 1.5)
            };
          }
        });
      } else {
        itemIds.forEach(id => {
          const armorIndex = newArmor.findIndex(a => a.id === id);
          if (armorIndex !== -1) {
            const armor = newArmor[armorIndex];
            totalCost += armor.upgradeCost;
            newArmor[armorIndex] = {
              ...armor,
              level: armor.level + 1,
              baseDef: armor.baseDef + 5,
              upgradeCost: Math.floor(armor.upgradeCost * 1.5)
            };
          }
        });
      }

      if (state.gems < totalCost) return state;

      return {
        ...state,
        gems: state.gems - totalCost,
        inventory: {
          ...state.inventory,
          weapons: newWeapons,
          armor: newArmor
        }
      };
    });
  }, [updateGameState]);

  const plantSeed = useCallback((): boolean => {
    if (!gameState || gameState.coins < gameState.gardenOfGrowth.seedCost || gameState.gardenOfGrowth.isPlanted) {
      return false;
    }

    updateGameState(state => ({
      ...state,
      coins: state.coins - state.gardenOfGrowth.seedCost,
      gardenOfGrowth: {
        ...state.gardenOfGrowth,
        isPlanted: true,
        plantedAt: new Date(),
        lastWatered: new Date(),
        waterHoursRemaining: 24
      }
    }));

    return true;
  }, [gameState, updateGameState]);

  const buyWater = useCallback((hours: number): boolean => {
    if (!gameState || gameState.coins < gameState.gardenOfGrowth.waterCost) {
      return false;
    }

    updateGameState(state => ({
      ...state,
      coins: state.coins - state.gardenOfGrowth.waterCost,
      gardenOfGrowth: {
        ...state.gardenOfGrowth,
        waterHoursRemaining: state.gardenOfGrowth.waterHoursRemaining + hours,
        lastWatered: new Date()
      }
    }));

    return true;
  }, [gameState, updateGameState]);

  const updateSettings = useCallback((newSettings: Partial<typeof gameState.settings>) => {
    updateGameState(state => ({
      ...state,
      settings: {
        ...state.settings,
        ...newSettings
      }
    }));
  }, [updateGameState]);

  const addCoins = useCallback((amount: number) => {
    updateGameState(state => ({
      ...state,
      coins: state.coins + amount
    }));
  }, [updateGameState]);

  const addGems = useCallback((amount: number) => {
    updateGameState(state => ({
      ...state,
      gems: state.gems + amount
    }));
  }, [updateGameState]);

  const teleportToZone = useCallback((zone: number) => {
    updateGameState(state => ({
      ...state,
      zone: Math.max(1, zone)
    }));
  }, [updateGameState]);

  const setExperience = useCallback((xp: number) => {
    updateGameState(state => ({
      ...state,
      progression: {
        ...state.progression,
        experience: Math.max(0, xp)
      }
    }));
  }, [updateGameState]);

  const rollSkill = useCallback((): boolean => {
    if (!gameState || gameState.coins < 100) return false;

    // Generate a random skill
    const skillTypes = ['coin_vacuum', 'treasurer', 'xp_surge', 'luck_gem', 'enchanter'];
    const randomType = skillTypes[Math.floor(Math.random() * skillTypes.length)];
    const duration = 2 + Math.floor(Math.random() * 6); // 2-8 hours
    
    const skill: MenuSkill = {
      id: Math.random().toString(36).substr(2, 9),
      name: randomType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `A powerful temporary skill effect`,
      duration,
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + duration * 60 * 60 * 1000),
      type: randomType as any
    };

    updateGameState(state => ({
      ...state,
      coins: state.coins - 100,
      skills: {
        ...state.skills,
        activeMenuSkill: skill,
        lastRollTime: new Date()
      }
    }));

    return true;
  }, [gameState, updateGameState]);

  const selectAdventureSkill = useCallback((skill: AdventureSkill) => {
    updateGameState(state => {
      const enemy = generateEnemy(state.zone);
      return {
        ...state,
        adventureSkills: {
          ...state.adventureSkills,
          selectedSkill: skill,
          showSelectionModal: false
        },
        currentEnemy: enemy,
        inCombat: true,
        combatLog: [`You encounter a ${enemy.name} in Zone ${enemy.zone}!`]
      };
    });
  }, [updateGameState]);

  const skipAdventureSkills = useCallback(() => {
    updateGameState(state => {
      const enemy = generateEnemy(state.zone);
      return {
        ...state,
        adventureSkills: {
          ...state.adventureSkills,
          showSelectionModal: false,
          selectedSkill: null
        },
        currentEnemy: enemy,
        inCombat: true,
        combatLog: [`You encounter a ${enemy.name} in Zone ${enemy.zone}!`]
      };
    });
  }, [updateGameState]);

  const useSkipCard = useCallback(() => {
    updateGameState(state => ({
      ...state,
      adventureSkills: {
        ...state.adventureSkills,
        skillEffects: {
          ...state.adventureSkills.skillEffects,
          skipCardUsed: true
        }
      }
    }));
  }, [updateGameState]);

  const spendFragments = useCallback((): boolean => {
    if (!gameState || gameState.merchant.hugollandFragments < 5) return false;

    // Generate random rewards
    const rewards: MerchantReward[] = [];
    for (let i = 0; i < 3; i++) {
      rewards.push({
        id: Math.random().toString(36).substr(2, 9),
        type: 'coins',
        name: 'Coin Reward',
        description: 'A pile of coins',
        icon: '💰',
        coins: 1000 + Math.floor(Math.random() * 2000)
      });
    }

    updateGameState(state => ({
      ...state,
      merchant: {
        ...state.merchant,
        hugollandFragments: state.merchant.hugollandFragments - 5,
        showRewardModal: true,
        availableRewards: rewards
      }
    }));

    return true;
  }, [gameState, updateGameState]);

  const selectMerchantReward = useCallback((reward: MerchantReward) => {
    updateGameState(state => {
      let newState = { ...state };

      // Apply reward
      if (reward.coins) {
        newState.coins += reward.coins;
      }
      if (reward.gems) {
        newState.gems += reward.gems;
      }

      return {
        ...newState,
        merchant: {
          ...state.merchant,
          showRewardModal: false,
          availableRewards: []
        }
      };
    });
  }, [updateGameState]);

  return {
    gameState,
    isLoading,
    equipWeapon,
    equipArmor,
    upgradeWeapon,
    upgradeArmor,
    sellWeapon,
    sellArmor,
    openChest,
    purchaseMythical,
    startCombat,
    attack,
    resetGame,
    setGameMode,
    toggleCheat,
    generateCheatItem,
    mineGem,
    exchangeShinyGems,
    discardItem,
    purchaseRelic,
    upgradeRelic,
    equipRelic,
    unequipRelic,
    sellRelic,
    claimDailyReward,
    upgradeSkill,
    prestige,
    claimOfflineRewards,
    bulkSell,
    bulkUpgrade,
    plantSeed,
    buyWater,
    updateSettings,
    addCoins,
    addGems,
    teleportToZone,
    setExperience,
    rollSkill,
    selectAdventureSkill,
    skipAdventureSkills,
    useSkipCard,
    spendFragments,
    selectMerchantReward
  };
};

export default useGameState;