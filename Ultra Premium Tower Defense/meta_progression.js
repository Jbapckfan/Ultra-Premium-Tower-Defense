// Ultra Premium Tower Defense - Meta Progression System
// Player levels, tower cards, research tree, and collection

class MetaProgressionSystem {
    constructor() {
        // Player progression
        this.playerLevel = this.loadPlayerLevel() || 1;
        this.playerXP = this.loadPlayerXP() || 0;
        this.totalXP = this.loadTotalXP() || 0;
        this.prestige = this.loadPrestige() || 0;

        // XP requirements per level (exponential curve)
        this.xpRequirements = this.generateXPCurve();

        // Tower card collection
        this.towerCards = this.loadTowerCards() || this.initializeTowerCards();

        // Research tree
        this.research = this.loadResearch() || this.initializeResearch();
        this.researchPoints = this.loadResearchPoints() || 0;

        // Daily quests
        this.dailyQuests = this.loadDailyQuests() || this.generateDailyQuests();
        this.questResetTime = this.loadQuestResetTime() || this.getNextResetTime();

        // Collection book
        this.collection = this.loadCollection() || this.initializeCollection();

        // Achievements
        this.achievements = this.loadAchievements() || this.initializeAchievements();

        // Player stats tracking
        this.stats = this.loadStats() || {
            totalKills: 0,
            totalDamage: 0,
            totalMoneyEarned: 0,
            totalWavesCompleted: 0,
            highestWave: 0,
            totalPlayTime: 0,
            towersBuilt: 0,
            towersMaxLevel: 0,
            perfectWaves: 0,
            bossesKilled: 0
        };

        // Initialize UI
        this.initializeUI();

        // Start quest timer
        this.startQuestTimer();
    }

    // XP and Leveling System
    generateXPCurve() {
        const curve = [];
        for (let level = 1; level <= 100; level++) {
            // Exponential growth: 100 * level^1.5
            curve[level] = Math.floor(100 * Math.pow(level, 1.5));
        }
        return curve;
    }

    addXP(amount, source = 'unknown') {
        this.playerXP += amount;
        this.totalXP += amount;

        // Check for level up
        while (this.playerXP >= this.xpRequirements[this.playerLevel] && this.playerLevel < 100) {
            this.playerXP -= this.xpRequirements[this.playerLevel];
            this.levelUp();
        }

        // Update UI
        this.updateProgressBar();

        // Track XP gain
        if (window.analytics) {
            window.analytics.track('xp_gained', {
                amount: amount,
                source: source,
                level: this.playerLevel
            });
        }

        // Show XP popup
        this.showXPGain(amount);

        this.save();
    }

    levelUp() {
        this.playerLevel++;

        // Level up rewards
        const rewards = this.getLevelRewards(this.playerLevel);
        this.giveLevelRewards(rewards);

        // Unlock new content
        this.checkUnlocks();

        // Show level up animation
        this.showLevelUpAnimation(rewards);

        // Track level up
        if (window.analytics) {
            window.analytics.track('player_level_up', {
                level: this.playerLevel,
                total_xp: this.totalXP
            });
        }

        // Give research points
        this.researchPoints += 1;
        if (this.playerLevel % 5 === 0) {
            this.researchPoints += 2; // Bonus points every 5 levels
        }
    }

    getLevelRewards(level) {
        const rewards = {
            gems: Math.floor(level * 5),
            money: Math.floor(level * 100 * Math.pow(1.1, level)),
            researchPoints: 1
        };

        // Milestone rewards
        if (level % 10 === 0) {
            rewards.gems *= 2;
            rewards.lootBox = 'premium';
        }
        if (level % 25 === 0) {
            rewards.lootBox = 'mega';
            rewards.towerCard = this.getRandomTowerCard('epic');
        }
        if (level === 50) {
            rewards.towerCard = this.getRandomTowerCard('legendary');
        }

        return rewards;
    }

    // Tower Card System
    initializeTowerCards() {
        const cards = {};
        const towerTypes = [
            { id: 'pulse', name: 'Pulse Cannon', rarity: 'common' },
            { id: 'laser', name: 'Laser Beam', rarity: 'common' },
            { id: 'missile', name: 'Missile Launcher', rarity: 'rare' },
            { id: 'tesla', name: 'Tesla Coil', rarity: 'rare' },
            { id: 'plasma', name: 'Plasma Cannon', rarity: 'rare' },
            { id: 'railgun', name: 'Railgun', rarity: 'epic' },
            { id: 'quantum', name: 'Quantum Tower', rarity: 'epic' },
            { id: 'crystal', name: 'Crystal Prism', rarity: 'epic' },
            { id: 'void', name: 'Void Graviton', rarity: 'legendary' },
            { id: 'omega', name: 'Omega Cannon', rarity: 'legendary' }
        ];

        towerTypes.forEach(tower => {
            cards[tower.id] = {
                id: tower.id,
                name: tower.name,
                rarity: tower.rarity,
                level: 1,
                stars: 1,
                count: tower.rarity === 'common' ? 1 : 0, // Start with common towers
                upgradeCount: 0,
                stats: this.getCardStats(tower.id, 1, 1)
            };
        });

        return cards;
    }

    getCardStats(towerId, level, stars) {
        // Base stats multiplied by level and stars
        const baseStats = {
            pulse: { damage: 10, range: 150, speed: 0.5 },
            laser: { damage: 5, range: 200, speed: 0.1 },
            missile: { damage: 25, range: 175, speed: 1.5 },
            tesla: { damage: 15, range: 125, speed: 0.8 },
            plasma: { damage: 20, range: 160, speed: 1.0 },
            railgun: { damage: 50, range: 250, speed: 2.0 },
            quantum: { damage: 30, range: 180, speed: 0.7 },
            crystal: { damage: 35, range: 200, speed: 0.9 },
            void: { damage: 75, range: 150, speed: 1.2 },
            omega: { damage: 100, range: 300, speed: 1.5 }
        };

        const stats = baseStats[towerId];
        return {
            damage: Math.floor(stats.damage * (1 + (level - 1) * 0.1) * (1 + (stars - 1) * 0.25)),
            range: Math.floor(stats.range * (1 + (stars - 1) * 0.1)),
            speed: stats.speed * (1 - (level - 1) * 0.02)
        };
    }

    upgradeTowerCard(towerId) {
        const card = this.towerCards[towerId];
        if (!card) return false;

        const requirements = this.getUpgradeRequirements(card);

        // Check requirements
        if (card.count < requirements.cards) {
            this.showNotification(`Need ${requirements.cards} cards to upgrade!`);
            return false;
        }

        if (window.money < requirements.money) {
            this.showNotification(`Need $${requirements.money} to upgrade!`);
            return false;
        }

        // Perform upgrade
        card.count -= requirements.cards;
        window.money -= requirements.money;
        card.level++;

        // Check for star upgrade
        if (card.level % 10 === 0 && card.stars < 5) {
            card.stars++;
            this.showNotification(`${card.name} evolved to ${card.stars} stars!`);
        }

        // Update stats
        card.stats = this.getCardStats(towerId, card.level, card.stars);
        card.upgradeCount++;

        // Update UI
        this.updateCardDisplay(towerId);

        // Track upgrade
        if (window.analytics) {
            window.analytics.track('tower_card_upgraded', {
                tower: towerId,
                level: card.level,
                stars: card.stars
            });
        }

        this.save();
        return true;
    }

    getUpgradeRequirements(card) {
        const baseCards = { common: 10, rare: 5, epic: 3, legendary: 2 };
        const baseMoney = { common: 100, rare: 250, epic: 500, legendary: 1000 };

        return {
            cards: baseCards[card.rarity] * Math.pow(2, card.stars - 1),
            money: Math.floor(baseMoney[card.rarity] * Math.pow(1.5, card.level))
        };
    }

    // Research Tree System
    initializeResearch() {
        return {
            // Offense Branch
            damageBonus: { level: 0, max: 10, cost: 1, effect: 5 }, // +5% damage per level
            attackSpeed: { level: 0, max: 10, cost: 1, effect: 3 }, // +3% speed per level
            criticalChance: { level: 0, max: 5, cost: 2, effect: 2 }, // +2% crit per level
            criticalDamage: { level: 0, max: 5, cost: 2, effect: 10 }, // +10% crit damage per level

            // Defense Branch
            towerHealth: { level: 0, max: 10, cost: 1, effect: 10 }, // +10% tower HP per level
            baseHealth: { level: 0, max: 10, cost: 1, effect: 5 }, // +5 base HP per level
            regeneration: { level: 0, max: 5, cost: 2, effect: 1 }, // +1 HP/wave per level

            // Economy Branch
            moneyBonus: { level: 0, max: 10, cost: 1, effect: 5 }, // +5% money per level
            startingMoney: { level: 0, max: 5, cost: 2, effect: 100 }, // +100 starting money
            gemBonus: { level: 0, max: 5, cost: 3, effect: 10 }, // +10% gem rewards

            // Utility Branch
            towerRange: { level: 0, max: 10, cost: 1, effect: 2 }, // +2% range per level
            sellValue: { level: 0, max: 5, cost: 1, effect: 5 }, // +5% sell value per level
            xpBonus: { level: 0, max: 10, cost: 2, effect: 5 }, // +5% XP gain per level

            // Ultimate Abilities (require level 50+)
            ultimateDamage: { level: 0, max: 1, cost: 10, effect: 50, requirement: 50 }, // +50% damage
            ultimateEconomy: { level: 0, max: 1, cost: 10, effect: 100, requirement: 50 }, // +100% money
            ultimateDefense: { level: 0, max: 1, cost: 10, effect: 50, requirement: 50 } // +50% base HP
        };
    }

    upgradeResearch(researchId) {
        const research = this.research[researchId];
        if (!research) return false;

        // Check if maxed
        if (research.level >= research.max) {
            this.showNotification('Research already maxed!');
            return false;
        }

        // Check level requirement
        if (research.requirement && this.playerLevel < research.requirement) {
            this.showNotification(`Requires level ${research.requirement}!`);
            return false;
        }

        // Check research points
        if (this.researchPoints < research.cost) {
            this.showNotification(`Need ${research.cost} research points!`);
            return false;
        }

        // Perform upgrade
        this.researchPoints -= research.cost;
        research.level++;

        // Apply effects immediately
        this.applyResearchEffects();

        // Update UI
        this.updateResearchDisplay();

        // Track research
        if (window.analytics) {
            window.analytics.track('research_upgraded', {
                research: researchId,
                level: research.level
            });
        }

        this.save();
        return true;
    }

    applyResearchEffects() {
        // Calculate total bonuses
        const bonuses = {
            damage: 1 + (this.research.damageBonus.level * 0.05),
            attackSpeed: 1 + (this.research.attackSpeed.level * 0.03),
            critChance: this.research.criticalChance.level * 0.02,
            critDamage: 1.5 + (this.research.criticalDamage.level * 0.1),
            towerHealth: 1 + (this.research.towerHealth.level * 0.1),
            baseHealth: 100 + (this.research.baseHealth.level * 5),
            regeneration: this.research.regeneration.level,
            moneyBonus: 1 + (this.research.moneyBonus.level * 0.05),
            startingMoney: 400 + (this.research.startingMoney.level * 100),
            gemBonus: 1 + (this.research.gemBonus.level * 0.1),
            towerRange: 1 + (this.research.towerRange.level * 0.02),
            sellValue: 0.5 + (this.research.sellValue.level * 0.05),
            xpBonus: 1 + (this.research.xpBonus.level * 0.05),
            ultimateDamage: this.research.ultimateDamage.level * 0.5,
            ultimateEconomy: this.research.ultimateEconomy.level * 1.0,
            ultimateDefense: this.research.ultimateDefense.level * 0.5
        };

        // Store for game to use
        window.researchBonuses = bonuses;
        return bonuses;
    }

    // Daily Quest System
    generateDailyQuests() {
        const questTemplates = [
            { type: 'kills', target: 500, reward: { gems: 10, xp: 100 }, description: 'Defeat 500 enemies' },
            { type: 'waves', target: 10, reward: { gems: 15, xp: 150 }, description: 'Complete 10 waves' },
            { type: 'towers', target: 50, reward: { gems: 5, xp: 50 }, description: 'Build 50 towers' },
            { type: 'money', target: 10000, reward: { gems: 20, xp: 200 }, description: 'Earn $10,000' },
            { type: 'upgrades', target: 20, reward: { gems: 10, xp: 100 }, description: 'Upgrade towers 20 times' },
            { type: 'boss', target: 1, reward: { gems: 25, xp: 250 }, description: 'Defeat 1 boss' },
            { type: 'perfect', target: 3, reward: { gems: 30, xp: 300 }, description: 'Complete 3 perfect waves' },
            { type: 'research', target: 1, reward: { gems: 15, xp: 150 }, description: 'Upgrade research 1 time' }
        ];

        // Select 3 random quests
        const quests = [];
        const used = new Set();

        while (quests.length < 3) {
            const template = questTemplates[Math.floor(Math.random() * questTemplates.length)];
            if (!used.has(template.type)) {
                used.add(template.type);
                quests.push({
                    ...template,
                    id: `quest_${Date.now()}_${quests.length}`,
                    progress: 0,
                    completed: false,
                    claimed: false
                });
            }
        }

        return quests;
    }

    updateQuestProgress(type, amount = 1) {
        let updated = false;

        this.dailyQuests.forEach(quest => {
            if (quest.type === type && !quest.completed) {
                quest.progress = Math.min(quest.progress + amount, quest.target);

                if (quest.progress >= quest.target) {
                    quest.completed = true;
                    this.showQuestComplete(quest);
                }

                updated = true;
            }
        });

        if (updated) {
            this.updateQuestDisplay();
            this.save();
        }
    }

    claimQuestReward(questId) {
        const quest = this.dailyQuests.find(q => q.id === questId);
        if (!quest || !quest.completed || quest.claimed) return false;

        // Give rewards
        if (quest.reward.gems && window.monetization) {
            window.monetization.addGems(quest.reward.gems, 'daily_quest');
        }
        if (quest.reward.xp) {
            this.addXP(quest.reward.xp, 'daily_quest');
        }

        quest.claimed = true;
        this.updateQuestDisplay();
        this.save();

        // Track quest completion
        if (window.analytics) {
            window.analytics.track('daily_quest_completed', {
                type: quest.type,
                reward: quest.reward
            });
        }

        return true;
    }

    getNextResetTime() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.getTime();
    }

    startQuestTimer() {
        setInterval(() => {
            if (Date.now() >= this.questResetTime) {
                this.dailyQuests = this.generateDailyQuests();
                this.questResetTime = this.getNextResetTime();
                this.save();
                this.updateQuestDisplay();
                this.showNotification('New daily quests available!');
            }
        }, 60000); // Check every minute
    }

    // Collection Book System
    initializeCollection() {
        return {
            towers: {
                pulse: { discovered: true, uses: 0, kills: 0 },
                laser: { discovered: true, uses: 0, kills: 0 },
                missile: { discovered: false, uses: 0, kills: 0 },
                tesla: { discovered: false, uses: 0, kills: 0 },
                plasma: { discovered: false, uses: 0, kills: 0 },
                railgun: { discovered: false, uses: 0, kills: 0 },
                quantum: { discovered: false, uses: 0, kills: 0 },
                crystal: { discovered: false, uses: 0, kills: 0 },
                void: { discovered: false, uses: 0, kills: 0 },
                omega: { discovered: false, uses: 0, kills: 0 }
            },
            enemies: {
                slime: { discovered: false, killed: 0, damageDealt: 0 },
                golem: { discovered: false, killed: 0, damageDealt: 0 },
                speeder: { discovered: false, killed: 0, damageDealt: 0 },
                tank: { discovered: false, killed: 0, damageDealt: 0 },
                ghost: { discovered: false, killed: 0, damageDealt: 0 },
                healer: { discovered: false, killed: 0, damageDealt: 0 },
                bomber: { discovered: false, killed: 0, damageDealt: 0 },
                boss: { discovered: false, killed: 0, damageDealt: 0 },
                megaBoss: { discovered: false, killed: 0, damageDealt: 0 }
            }
        };
    }

    updateCollection(category, id, data) {
        if (!this.collection[category] || !this.collection[category][id]) return;

        const entry = this.collection[category][id];

        if (!entry.discovered) {
            entry.discovered = true;
            this.showDiscovery(category, id);
        }

        Object.keys(data).forEach(key => {
            if (key in entry) {
                entry[key] += data[key];
            }
        });

        this.save();
    }

    // Achievement System
    initializeAchievements() {
        return [
            { id: 'first_kill', name: 'First Blood', description: 'Defeat your first enemy', completed: false, reward: { gems: 5 } },
            { id: 'wave_10', name: 'Survivor', description: 'Reach wave 10', completed: false, reward: { gems: 10 } },
            { id: 'wave_50', name: 'Defender', description: 'Reach wave 50', completed: false, reward: { gems: 50 } },
            { id: 'wave_100', name: 'Legend', description: 'Reach wave 100', completed: false, reward: { gems: 100, card: 'legendary' } },
            { id: 'money_10k', name: 'Wealthy', description: 'Earn $10,000 in one game', completed: false, reward: { gems: 20 } },
            { id: 'perfect_wave', name: 'Flawless', description: 'Complete a wave without losing health', completed: false, reward: { gems: 15 } },
            { id: 'tower_master', name: 'Tower Master', description: 'Use all 10 tower types', completed: false, reward: { gems: 30 } },
            { id: 'research_10', name: 'Scientist', description: 'Unlock 10 research upgrades', completed: false, reward: { gems: 25 } },
            { id: 'level_50', name: 'Veteran', description: 'Reach player level 50', completed: false, reward: { gems: 100, card: 'epic' } },
            { id: 'collection_complete', name: 'Collector', description: 'Discover all enemies and towers', completed: false, reward: { gems: 200 } }
        ];
    }

    checkAchievement(achievementId, condition) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement || achievement.completed) return;

        if (condition) {
            achievement.completed = true;
            this.giveAchievementReward(achievement);
            this.showAchievementUnlocked(achievement);

            // Track achievement
            if (window.analytics) {
                window.analytics.track('achievement_unlocked', {
                    id: achievementId,
                    name: achievement.name
                });
            }

            this.save();
        }
    }

    // UI System
    initializeUI() {
        // Create meta progression UI container
        const container = document.createElement('div');
        container.id = 'meta-progression-ui';
        container.innerHTML = `
            <style>
                #meta-progression-ui {
                    position: fixed;
                    top: 80px;
                    left: 10px;
                    z-index: 9500;
                }

                .player-level-display {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 20px;
                    padding: 10px 20px;
                    color: white;
                    font-weight: bold;
                    margin-bottom: 10px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    cursor: pointer;
                }

                .xp-bar {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 10px;
                    height: 20px;
                    overflow: hidden;
                    margin-top: 5px;
                    position: relative;
                }

                .xp-fill {
                    background: linear-gradient(90deg, #4CAF50, #8BC34A);
                    height: 100%;
                    transition: width 0.5s ease;
                    border-radius: 10px;
                }

                .xp-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 12px;
                    color: white;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
                }

                .quest-panel {
                    background: rgba(0, 0, 0, 0.8);
                    border-radius: 15px;
                    padding: 15px;
                    color: white;
                    margin-top: 10px;
                    max-width: 250px;
                }

                .quest-item {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    padding: 10px;
                    margin: 10px 0;
                    position: relative;
                }

                .quest-progress {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 5px;
                    height: 15px;
                    margin-top: 5px;
                    overflow: hidden;
                }

                .quest-progress-fill {
                    background: #4CAF50;
                    height: 100%;
                    transition: width 0.3s ease;
                }

                .quest-claim-btn {
                    background: #FFD700;
                    border: none;
                    border-radius: 5px;
                    padding: 5px 10px;
                    color: #333;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 5px;
                }

                .meta-button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 15px;
                    padding: 10px 20px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    margin: 5px 0;
                    display: block;
                    width: 100%;
                    transition: transform 0.2s;
                }

                .meta-button:hover {
                    transform: scale(1.05);
                }
            </style>

            <div class="player-level-display" onclick="metaProgression.showProgressDetails()">
                <div>Level <span id="player-level">1</span></div>
                <div class="xp-bar">
                    <div class="xp-fill" id="xp-fill" style="width: 0%"></div>
                    <div class="xp-text" id="xp-text">0 / 100 XP</div>
                </div>
            </div>

            <button class="meta-button" onclick="metaProgression.showTowerCards()">🎴 Tower Cards</button>
            <button class="meta-button" onclick="metaProgression.showResearchTree()">🔬 Research</button>
            <button class="meta-button" onclick="metaProgression.showCollection()">📚 Collection</button>

            <div class="quest-panel">
                <h4 style="margin: 0 0 10px 0; text-align: center;">Daily Quests</h4>
                <div id="quest-list"></div>
                <div style="text-align: center; font-size: 12px; opacity: 0.7; margin-top: 10px;">
                    Resets in: <span id="quest-timer">00:00:00</span>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this.updateAllDisplays();

        // Start UI update timer
        setInterval(() => this.updateTimers(), 1000);
    }

    updateAllDisplays() {
        this.updateProgressBar();
        this.updateQuestDisplay();
    }

    updateProgressBar() {
        const levelEl = document.getElementById('player-level');
        const fillEl = document.getElementById('xp-fill');
        const textEl = document.getElementById('xp-text');

        if (levelEl) levelEl.textContent = this.playerLevel;

        const required = this.xpRequirements[this.playerLevel] || 999999;
        const progress = (this.playerXP / required) * 100;

        if (fillEl) fillEl.style.width = `${progress}%`;
        if (textEl) textEl.textContent = `${this.playerXP} / ${required} XP`;
    }

    updateQuestDisplay() {
        const listEl = document.getElementById('quest-list');
        if (!listEl) return;

        listEl.innerHTML = this.dailyQuests.map(quest => `
            <div class="quest-item">
                <div style="font-size: 14px; font-weight: bold;">${quest.description}</div>
                <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">
                    Reward: 💎${quest.reward.gems} ⭐${quest.reward.xp} XP
                </div>
                <div class="quest-progress">
                    <div class="quest-progress-fill" style="width: ${(quest.progress / quest.target) * 100}%"></div>
                </div>
                <div style="font-size: 12px; text-align: center; margin-top: 5px;">
                    ${quest.progress} / ${quest.target}
                </div>
                ${quest.completed && !quest.claimed ?
                    `<button class="quest-claim-btn" onclick="metaProgression.claimQuestReward('${quest.id}')">Claim!</button>` :
                    (quest.claimed ? '<div style="text-align: center; color: #4CAF50;">✓ Claimed</div>' : '')}
            </div>
        `).join('');
    }

    updateTimers() {
        const timerEl = document.getElementById('quest-timer');
        if (timerEl) {
            const remaining = Math.max(0, this.questResetTime - Date.now());
            const hours = Math.floor(remaining / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            timerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // Modal displays
    showTowerCards() {
        // Create modal for tower cards display
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const content = `
            <div style="background: #222; border-radius: 20px; padding: 30px; max-width: 800px; max-height: 80vh; overflow-y: auto; color: white;">
                <h2 style="text-align: center; margin-bottom: 20px;">🎴 Tower Card Collection</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                    ${Object.values(this.towerCards).map(card => `
                        <div style="background: linear-gradient(135deg, ${this.getRarityColor(card.rarity)}); border-radius: 15px; padding: 15px; text-align: center;">
                            <div style="font-size: 36px;">🗼</div>
                            <div style="font-weight: bold;">${card.name}</div>
                            <div style="font-size: 20px; margin: 5px 0;">${'⭐'.repeat(card.stars)}</div>
                            <div>Level ${card.level}</div>
                            <div style="font-size: 12px; opacity: 0.8;">
                                DMG: ${card.stats.damage}<br>
                                RNG: ${card.stats.range}<br>
                                SPD: ${card.stats.speed.toFixed(2)}s
                            </div>
                            <div style="margin-top: 10px;">
                                Cards: ${card.count}<br>
                                ${card.count > 0 ? `<button onclick="metaProgression.upgradeTowerCard('${card.id}')" style="margin-top: 5px; padding: 5px 10px; background: #4CAF50; border: none; border-radius: 5px; color: white; cursor: pointer;">Upgrade</button>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 20px; padding: 10px 30px; background: #f44336; border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; display: block; margin-left: auto; margin-right: auto;">Close</button>
            </div>
        `;

        modal.innerHTML = content;
        document.body.appendChild(modal);
    }

    showResearchTree() {
        // Create modal for research tree display
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const content = `
            <div style="background: #222; border-radius: 20px; padding: 30px; max-width: 800px; max-height: 80vh; overflow-y: auto; color: white;">
                <h2 style="text-align: center; margin-bottom: 20px;">🔬 Research Tree</h2>
                <div style="text-align: center; margin-bottom: 20px;">
                    Research Points: <span style="color: #4CAF50; font-size: 24px; font-weight: bold;">${this.researchPoints}</span>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #ff6b6b;">⚔️ Offense</h3>
                    ${this.renderResearchItem('damageBonus', 'Damage Bonus', `+${this.research.damageBonus.level * 5}% damage`)}
                    ${this.renderResearchItem('attackSpeed', 'Attack Speed', `+${this.research.attackSpeed.level * 3}% speed`)}
                    ${this.renderResearchItem('criticalChance', 'Critical Chance', `+${this.research.criticalChance.level * 2}% crit`)}
                    ${this.renderResearchItem('criticalDamage', 'Critical Damage', `+${this.research.criticalDamage.level * 10}% crit dmg`)}
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #4ecdc4;">🛡️ Defense</h3>
                    ${this.renderResearchItem('towerHealth', 'Tower Health', `+${this.research.towerHealth.level * 10}% HP`)}
                    ${this.renderResearchItem('baseHealth', 'Base Health', `+${this.research.baseHealth.level * 5} HP`)}
                    ${this.renderResearchItem('regeneration', 'Regeneration', `+${this.research.regeneration.level} HP/wave`)}
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #FFD700;">💰 Economy</h3>
                    ${this.renderResearchItem('moneyBonus', 'Money Bonus', `+${this.research.moneyBonus.level * 5}% money`)}
                    ${this.renderResearchItem('startingMoney', 'Starting Money', `+${this.research.startingMoney.level * 100} start`)}
                    ${this.renderResearchItem('gemBonus', 'Gem Bonus', `+${this.research.gemBonus.level * 10}% gems`)}
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #96ceb4;">🔧 Utility</h3>
                    ${this.renderResearchItem('towerRange', 'Tower Range', `+${this.research.towerRange.level * 2}% range`)}
                    ${this.renderResearchItem('sellValue', 'Sell Value', `+${this.research.sellValue.level * 5}% sell`)}
                    ${this.renderResearchItem('xpBonus', 'XP Bonus', `+${this.research.xpBonus.level * 5}% XP`)}
                </div>

                <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 20px; padding: 10px 30px; background: #f44336; border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; display: block; margin-left: auto; margin-right: auto;">Close</button>
            </div>
        `;

        modal.innerHTML = content;
        document.body.appendChild(modal);
    }

    renderResearchItem(id, name, effect) {
        const research = this.research[id];
        const canUpgrade = research.level < research.max && this.researchPoints >= research.cost;
        const isMaxed = research.level >= research.max;
        const meetsRequirement = !research.requirement || this.playerLevel >= research.requirement;

        return `
            <div style="background: rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 10px; margin: 10px 0; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: bold;">${name}</div>
                    <div style="font-size: 14px; opacity: 0.8;">${effect}</div>
                    <div style="font-size: 12px; opacity: 0.6;">Level ${research.level}/${research.max}</div>
                    ${research.requirement ? `<div style="font-size: 12px; color: ${meetsRequirement ? '#4CAF50' : '#ff6b6b'};">Requires Level ${research.requirement}</div>` : ''}
                </div>
                <div>
                    ${isMaxed ?
                        '<span style="color: #4CAF50; font-weight: bold;">MAX</span>' :
                        `<button onclick="metaProgression.upgradeResearch('${id}')" style="padding: 5px 15px; background: ${canUpgrade && meetsRequirement ? '#4CAF50' : '#666'}; border: none; border-radius: 5px; color: white; cursor: ${canUpgrade && meetsRequirement ? 'pointer' : 'not-allowed'};" ${!canUpgrade || !meetsRequirement ? 'disabled' : ''}>
                            Upgrade (${research.cost} RP)
                        </button>`
                    }
                </div>
            </div>
        `;
    }

    showCollection() {
        // Show collection book modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const towerCount = Object.values(this.collection.towers).filter(t => t.discovered).length;
        const enemyCount = Object.values(this.collection.enemies).filter(e => e.discovered).length;

        const content = `
            <div style="background: #222; border-radius: 20px; padding: 30px; max-width: 800px; max-height: 80vh; overflow-y: auto; color: white;">
                <h2 style="text-align: center; margin-bottom: 20px;">📚 Collection Book</h2>

                <h3>Towers (${towerCount}/10)</h3>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px;">
                    ${Object.entries(this.collection.towers).map(([id, data]) => `
                        <div style="background: ${data.discovered ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)'}; border-radius: 10px; padding: 10px; text-align: center;">
                            <div style="font-size: 24px;">${data.discovered ? '🗼' : '❓'}</div>
                            <div style="font-size: 12px;">${data.discovered ? id : '???'}</div>
                            ${data.discovered ? `<div style="font-size: 10px; opacity: 0.7;">Kills: ${data.kills}</div>` : ''}
                        </div>
                    `).join('')}
                </div>

                <h3>Enemies (${enemyCount}/9)</h3>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;">
                    ${Object.entries(this.collection.enemies).map(([id, data]) => `
                        <div style="background: ${data.discovered ? 'rgba(244, 67, 54, 0.2)' : 'rgba(255, 255, 255, 0.05)'}; border-radius: 10px; padding: 10px; text-align: center;">
                            <div style="font-size: 24px;">${data.discovered ? '👾' : '❓'}</div>
                            <div style="font-size: 12px;">${data.discovered ? id : '???'}</div>
                            ${data.discovered ? `<div style="font-size: 10px; opacity: 0.7;">Killed: ${data.killed}</div>` : ''}
                        </div>
                    `).join('')}
                </div>

                <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 20px; padding: 10px 30px; background: #f44336; border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; display: block; margin-left: auto; margin-right: auto;">Close</button>
            </div>
        `;

        modal.innerHTML = content;
        document.body.appendChild(modal);
    }

    // Utility functions
    getRarityColor(rarity) {
        const colors = {
            common: '#999999, #666666',
            rare: '#4169E1, #1E90FF',
            epic: '#9932CC, #8A2BE2',
            legendary: '#FFD700, #FFA500'
        };
        return colors[rarity] || '#666666, #333333';
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 20px 40px;
            border-radius: 15px;
            font-size: 18px;
            font-weight: bold;
            z-index: 10002;
            animation: slideIn 0.5s;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    showXPGain(amount) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            left: 100px;
            top: 100px;
            color: #8BC34A;
            font-size: 20px;
            font-weight: bold;
            z-index: 10000;
            animation: floatUp 2s ease-out;
            pointer-events: none;
        `;
        popup.textContent = `+${amount} XP`;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 2000);
    }

    showLevelUpAnimation(rewards) {
        const animation = document.createElement('div');
        animation.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #333;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            z-index: 10002;
            animation: bounceIn 0.5s;
        `;
        animation.innerHTML = `
            <h2 style="margin: 0 0 20px 0; font-size: 36px;">LEVEL UP!</h2>
            <div style="font-size: 48px; margin-bottom: 20px;">⭐ ${this.playerLevel} ⭐</div>
            <div style="font-size: 20px;">
                ${rewards.gems ? `💎 +${rewards.gems} Gems<br>` : ''}
                ${rewards.money ? `💰 +$${rewards.money}<br>` : ''}
                ${rewards.researchPoints ? `🔬 +${rewards.researchPoints} Research Points<br>` : ''}
                ${rewards.lootBox ? `🎁 ${rewards.lootBox} Loot Box<br>` : ''}
                ${rewards.towerCard ? `🎴 ${rewards.towerCard} Tower Card` : ''}
            </div>
        `;
        document.body.appendChild(animation);
        setTimeout(() => animation.remove(), 5000);
    }

    // Save/Load functions
    save() {
        localStorage.setItem('player_level', this.playerLevel);
        localStorage.setItem('player_xp', this.playerXP);
        localStorage.setItem('total_xp', this.totalXP);
        localStorage.setItem('prestige', this.prestige);
        localStorage.setItem('tower_cards', JSON.stringify(this.towerCards));
        localStorage.setItem('research', JSON.stringify(this.research));
        localStorage.setItem('research_points', this.researchPoints);
        localStorage.setItem('daily_quests', JSON.stringify(this.dailyQuests));
        localStorage.setItem('quest_reset_time', this.questResetTime);
        localStorage.setItem('collection', JSON.stringify(this.collection));
        localStorage.setItem('achievements', JSON.stringify(this.achievements));
        localStorage.setItem('player_stats', JSON.stringify(this.stats));
    }

    loadPlayerLevel() { return parseInt(localStorage.getItem('player_level')) || 1; }
    loadPlayerXP() { return parseInt(localStorage.getItem('player_xp')) || 0; }
    loadTotalXP() { return parseInt(localStorage.getItem('total_xp')) || 0; }
    loadPrestige() { return parseInt(localStorage.getItem('prestige')) || 0; }
    loadTowerCards() { const saved = localStorage.getItem('tower_cards'); return saved ? JSON.parse(saved) : null; }
    loadResearch() { const saved = localStorage.getItem('research'); return saved ? JSON.parse(saved) : null; }
    loadResearchPoints() { return parseInt(localStorage.getItem('research_points')) || 0; }
    loadDailyQuests() { const saved = localStorage.getItem('daily_quests'); return saved ? JSON.parse(saved) : null; }
    loadQuestResetTime() { return parseInt(localStorage.getItem('quest_reset_time')) || 0; }
    loadCollection() { const saved = localStorage.getItem('collection'); return saved ? JSON.parse(saved) : null; }
    loadAchievements() { const saved = localStorage.getItem('achievements'); return saved ? JSON.parse(saved) : null; }
    loadStats() { const saved = localStorage.getItem('player_stats'); return saved ? JSON.parse(saved) : null; }
}

// Initialize meta progression system
window.metaProgression = new MetaProgressionSystem();

// Export for use in game
window.MetaProgressionSystem = MetaProgressionSystem;