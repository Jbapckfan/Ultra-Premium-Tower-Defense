// Ultra Premium Tower Defense - Monetization System
// Immediate and Core F2P Features

class MonetizationSystem {
    constructor() {
        // Premium Currency
        this.gems = this.loadGems() || 50; // Start with 50 gems
        this.adsEnabled = this.loadAdsEnabled() !== false; // Default true

        // Energy System
        this.maxLives = 5;
        this.currentLives = this.loadLives() || 5;
        this.lastLifeRegenTime = this.loadLastRegenTime() || Date.now();
        this.lifeRegenInterval = 30 * 60 * 1000; // 30 minutes in ms

        // Battle Pass
        this.battlePass = this.loadBattlePass() || {
            active: false,
            tier: 0,
            xp: 0,
            season: 1,
            endDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
            rewards: this.generateBattlePassRewards()
        };

        // VIP System
        this.vipTier = this.loadVIPTier() || 0; // 0 = none, 1-3 = tiers
        this.vipExpiry = this.loadVIPExpiry() || 0;

        // Gacha System
        this.towerRarities = {
            common: 0.65,    // 65%
            rare: 0.25,      // 25%
            epic: 0.08,      // 8%
            legendary: 0.02  // 2%
        };

        // IAP Products
        this.products = {
            removeAds: { id: 'com.ultra.towerdefense.removeads', price: 4.99 },
            gems100: { id: 'com.ultra.towerdefense.gems100', price: 0.99 },
            gems550: { id: 'com.ultra.towerdefense.gems550', price: 4.99 },
            gems1200: { id: 'com.ultra.towerdefense.gems1200', price: 9.99 },
            gems2500: { id: 'com.ultra.towerdefense.gems2500', price: 19.99 },
            gems6500: { id: 'com.ultra.towerdefense.gems6500', price: 49.99 },
            starterPack: { id: 'com.ultra.towerdefense.starter', price: 2.99 },
            valuePack: { id: 'com.ultra.towerdefense.value', price: 9.99 },
            megaPack: { id: 'com.ultra.towerdefense.mega', price: 29.99 },
            battlePass: { id: 'com.ultra.towerdefense.battlepass', price: 9.99 },
            vip1: { id: 'com.ultra.towerdefense.vip1', price: 4.99 },
            vip2: { id: 'com.ultra.towerdefense.vip2', price: 9.99 },
            vip3: { id: 'com.ultra.towerdefense.vip3', price: 19.99 }
        };

        // Daily Rewards
        this.dailyRewards = [
            { day: 1, gems: 10, coins: 500 },
            { day: 2, gems: 15, coins: 750 },
            { day: 3, gems: 20, coins: 1000 },
            { day: 4, gems: 25, coins: 1500 },
            { day: 5, gems: 30, coins: 2000 },
            { day: 6, gems: 40, coins: 2500 },
            { day: 7, gems: 100, coins: 5000, tower: 'rare' }
        ];
        this.currentLoginStreak = this.loadLoginStreak() || 0;
        this.lastLoginDate = this.loadLastLogin() || null;

        // Ad System
        this.rewardedAdRewards = {
            doubleMoney: { duration: 300000 }, // 5 minutes
            speedBoost: { multiplier: 2, duration: 180000 }, // 3 minutes
            extraLife: { lives: 1 },
            gems: { amount: 5 },
            skipWave: { waves: 1 }
        };

        // Initialize UI
        this.initializeUI();

        // Start life regeneration timer
        this.startLifeRegeneration();

        // Check daily login
        this.checkDailyLogin();
    }

    // Premium Currency System
    addGems(amount, source = 'unknown') {
        this.gems += amount;
        this.saveGems();
        this.updateUI();

        // Analytics tracking
        this.trackEvent('gems_earned', { amount, source });

        // Show floating text
        this.showFloatingText(`+${amount} 💎`, '#00ff88');

        return this.gems;
    }

    spendGems(amount, item = 'unknown') {
        if (this.gems < amount) {
            this.showInsufficientGemsModal();
            return false;
        }

        this.gems -= amount;
        this.saveGems();
        this.updateUI();

        // Analytics tracking
        this.trackEvent('gems_spent', { amount, item });

        return true;
    }

    // Energy/Lives System
    regenerateLife() {
        const now = Date.now();
        const timeSinceLastRegen = now - this.lastLifeRegenTime;
        const livesToRegen = Math.floor(timeSinceLastRegen / this.lifeRegenInterval);

        if (livesToRegen > 0 && this.currentLives < this.maxLives) {
            const newLives = Math.min(this.currentLives + livesToRegen, this.maxLives);
            const livesAdded = newLives - this.currentLives;
            this.currentLives = newLives;
            this.lastLifeRegenTime = now - (timeSinceLastRegen % this.lifeRegenInterval);

            if (livesAdded > 0) {
                this.showNotification(`${livesAdded} life regenerated!`);
                this.saveLives();
                this.updateUI();
            }
        }

        return this.currentLives;
    }

    startLifeRegeneration() {
        // Check every minute
        setInterval(() => {
            this.regenerateLife();
        }, 60000);

        // Initial check
        this.regenerateLife();
    }

    useLife() {
        if (this.currentLives <= 0) {
            this.showNoLivesModal();
            return false;
        }

        this.currentLives--;
        this.saveLives();
        this.updateUI();

        // Start regen timer if at max
        if (this.currentLives === this.maxLives - 1) {
            this.lastLifeRegenTime = Date.now();
            this.saveLastRegenTime();
        }

        return true;
    }

    // Battle Pass System
    addBattlePassXP(amount) {
        if (!this.battlePass.active) return;

        const oldTier = this.battlePass.tier;
        this.battlePass.xp += amount;

        // 1000 XP per tier
        while (this.battlePass.xp >= 1000) {
            this.battlePass.xp -= 1000;
            this.battlePass.tier++;

            if (this.battlePass.tier <= 30) {
                const reward = this.battlePass.rewards[this.battlePass.tier - 1];
                this.claimBattlePassReward(reward);
            }
        }

        if (this.battlePass.tier > oldTier) {
            this.showNotification(`Battle Pass Tier ${this.battlePass.tier} Unlocked!`);
        }

        this.saveBattlePass();
        this.updateUI();
    }

    generateBattlePassRewards() {
        const rewards = [];
        for (let i = 1; i <= 30; i++) {
            const reward = {
                tier: i,
                free: null,
                premium: null
            };

            // Free rewards every 3 tiers
            if (i % 3 === 0) {
                reward.free = {
                    type: 'coins',
                    amount: i * 500
                };
            }

            // Premium rewards every tier
            if (i % 5 === 0) {
                reward.premium = {
                    type: 'tower',
                    rarity: i === 30 ? 'legendary' : (i >= 20 ? 'epic' : 'rare')
                };
            } else {
                reward.premium = {
                    type: 'gems',
                    amount: Math.floor(i * 5 + Math.random() * 10)
                };
            }

            rewards.push(reward);
        }
        return rewards;
    }

    // Gacha/Loot Box System
    openLootBox(type = 'standard') {
        const costs = {
            standard: 100,  // 100 gems
            premium: 250,   // 250 gems
            mega: 500      // 500 gems
        };

        if (!this.spendGems(costs[type], `lootbox_${type}`)) {
            return null;
        }

        // Roll for rarity
        const roll = Math.random();
        let rarity = 'common';
        let cumulative = 0;

        // Premium boxes have better odds
        const multiplier = type === 'mega' ? 2 : (type === 'premium' ? 1.5 : 1);

        for (const [r, chance] of Object.entries(this.towerRarities)) {
            cumulative += chance * (r === 'legendary' || r === 'epic' ? multiplier : 1);
            if (roll <= cumulative) {
                rarity = r;
                break;
            }
        }

        // Get random tower of that rarity
        const tower = this.getRandomTowerByRarity(rarity);

        // Show loot box opening animation
        this.showLootBoxAnimation(tower, rarity);

        // Save to inventory
        this.addTowerToInventory(tower);

        return { tower, rarity };
    }

    getRandomTowerByRarity(rarity) {
        const towersByRarity = {
            common: ['Pulse Cannon', 'Laser Beam'],
            rare: ['Missile Launcher', 'Tesla Coil', 'Plasma Cannon'],
            epic: ['Railgun', 'Quantum Tower', 'Crystal Prism'],
            legendary: ['Void Graviton', 'Omega Cannon']
        };

        const towers = towersByRarity[rarity];
        return towers[Math.floor(Math.random() * towers.length)];
    }

    // VIP System
    getVIPBenefits() {
        const benefits = {
            0: { moneyMultiplier: 1, xpMultiplier: 1, dailyGems: 0, skipAds: false },
            1: { moneyMultiplier: 1.25, xpMultiplier: 1.25, dailyGems: 10, skipAds: true },
            2: { moneyMultiplier: 1.5, xpMultiplier: 1.5, dailyGems: 25, skipAds: true },
            3: { moneyMultiplier: 2, xpMultiplier: 2, dailyGems: 50, skipAds: true }
        };

        return benefits[this.vipTier] || benefits[0];
    }

    activateVIP(tier, days = 30) {
        this.vipTier = tier;
        this.vipExpiry = Date.now() + (days * 24 * 60 * 60 * 1000);
        this.saveVIP();
        this.updateUI();

        this.showNotification(`VIP Tier ${tier} Activated for ${days} days!`);

        // Apply immediate benefits
        const benefits = this.getVIPBenefits();
        if (benefits.dailyGems > 0) {
            this.addGems(benefits.dailyGems, 'vip_daily');
        }
    }

    checkVIPExpiry() {
        if (this.vipTier > 0 && Date.now() > this.vipExpiry) {
            this.vipTier = 0;
            this.saveVIP();
            this.showNotification('Your VIP subscription has expired');
            this.updateUI();
        }
    }

    // Rewarded Ads System
    showRewardedAd(rewardType) {
        if (!this.adsEnabled) {
            this.showNotification('Ads are disabled');
            return;
        }

        // Simulate ad viewing (in real game, this would call ad SDK)
        this.showAdModal(() => {
            this.giveRewardedAdReward(rewardType);
        });
    }

    giveRewardedAdReward(rewardType) {
        const reward = this.rewardedAdRewards[rewardType];

        switch(rewardType) {
            case 'doubleMoney':
                window.moneyMultiplier = 2;
                setTimeout(() => { window.moneyMultiplier = 1; }, reward.duration);
                this.showNotification('Double money activated for 5 minutes!');
                break;

            case 'speedBoost':
                window.gameSpeed = reward.multiplier;
                setTimeout(() => { window.gameSpeed = 1; }, reward.duration);
                this.showNotification('2x speed activated for 3 minutes!');
                break;

            case 'extraLife':
                this.currentLives = Math.min(this.currentLives + reward.lives, this.maxLives);
                this.saveLives();
                this.updateUI();
                this.showNotification('+1 Life!');
                break;

            case 'gems':
                this.addGems(reward.amount, 'rewarded_ad');
                break;

            case 'skipWave':
                if (window.currentWave) {
                    window.currentWave++;
                    window.money += 1000;
                    this.showNotification('Wave skipped! +$1000');
                }
                break;
        }

        this.trackEvent('rewarded_ad_completed', { type: rewardType });
    }

    // IAP Handling
    purchaseProduct(productId) {
        const product = Object.values(this.products).find(p => p.id === productId);
        if (!product) return;

        // In real implementation, this would call StoreKit
        // For now, simulate purchase
        this.simulatePurchase(productId);
    }

    simulatePurchase(productId) {
        switch(productId) {
            case this.products.removeAds.id:
                this.adsEnabled = false;
                this.saveAdsEnabled();
                this.showNotification('Ads removed!');
                break;

            case this.products.gems100.id:
                this.addGems(100, 'iap');
                break;

            case this.products.gems550.id:
                this.addGems(550, 'iap');
                break;

            case this.products.gems1200.id:
                this.addGems(1200, 'iap');
                break;

            case this.products.gems2500.id:
                this.addGems(2500, 'iap');
                break;

            case this.products.gems6500.id:
                this.addGems(6500, 'iap');
                break;

            case this.products.starterPack.id:
                this.addGems(300, 'iap');
                window.money += 5000;
                this.addTowerToInventory('Tesla Coil');
                this.showNotification('Starter Pack claimed!');
                break;

            case this.products.valuePack.id:
                this.addGems(1000, 'iap');
                window.money += 15000;
                this.addTowerToInventory('Quantum Tower');
                this.showNotification('Value Pack claimed!');
                break;

            case this.products.megaPack.id:
                this.addGems(3000, 'iap');
                window.money += 50000;
                this.addTowerToInventory('Omega Cannon');
                this.currentLives = this.maxLives;
                this.showNotification('Mega Pack claimed!');
                break;

            case this.products.battlePass.id:
                this.battlePass.active = true;
                this.saveBattlePass();
                this.showNotification('Battle Pass activated!');
                break;

            case this.products.vip1.id:
                this.activateVIP(1, 30);
                break;

            case this.products.vip2.id:
                this.activateVIP(2, 30);
                break;

            case this.products.vip3.id:
                this.activateVIP(3, 30);
                break;
        }

        this.trackEvent('iap_purchase', { product: productId });
        this.updateUI();
    }

    // Daily Login System
    checkDailyLogin() {
        const today = new Date().toDateString();

        if (this.lastLoginDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();

            if (this.lastLoginDate === yesterday) {
                // Continue streak
                this.currentLoginStreak++;
            } else {
                // Reset streak
                this.currentLoginStreak = 1;
            }

            this.lastLoginDate = today;
            this.saveLoginData();

            // Give daily reward
            const dayIndex = ((this.currentLoginStreak - 1) % 7);
            const reward = this.dailyRewards[dayIndex];

            this.addGems(reward.gems, 'daily_login');
            window.money += reward.coins;

            if (reward.tower) {
                this.addTowerToInventory(this.getRandomTowerByRarity(reward.tower));
            }

            this.showDailyRewardModal(reward, this.currentLoginStreak);
        }
    }

    // UI System
    initializeUI() {
        // Create monetization UI container
        const uiContainer = document.createElement('div');
        uiContainer.id = 'monetization-ui';
        uiContainer.innerHTML = `
            <style>
                #monetization-ui {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    z-index: 10000;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                .currency-display {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 20px;
                    padding: 10px 20px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    margin-bottom: 10px;
                }

                .currency-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    color: white;
                    font-weight: bold;
                    font-size: 18px;
                }

                .currency-icon {
                    font-size: 24px;
                }

                .add-button {
                    background: #4CAF50;
                    border: none;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .add-button:hover {
                    transform: scale(1.1);
                }

                .lives-display {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    border-radius: 20px;
                    padding: 10px 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    margin-bottom: 10px;
                    color: white;
                    font-weight: bold;
                }

                .life-timer {
                    font-size: 14px;
                    opacity: 0.9;
                }

                .vip-badge {
                    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                    border-radius: 15px;
                    padding: 5px 15px;
                    color: #333;
                    font-weight: bold;
                    font-size: 14px;
                    box-shadow: 0 2px 10px rgba(255, 215, 0, 0.5);
                }

                .shop-button {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 50%;
                    width: 60px;
                    height: 60px;
                    font-size: 30px;
                    color: white;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                    transition: transform 0.2s;
                    z-index: 9999;
                }

                .shop-button:hover {
                    transform: scale(1.1);
                }

                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 10001;
                    justify-content: center;
                    align-items: center;
                }

                .modal-content {
                    background: white;
                    border-radius: 20px;
                    padding: 30px;
                    max-width: 500px;
                    max-height: 80vh;
                    overflow-y: auto;
                    position: relative;
                }

                .close-modal {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    font-size: 30px;
                    cursor: pointer;
                    color: #999;
                }

                .close-modal:hover {
                    color: #333;
                }

                .shop-item {
                    background: #f5f5f5;
                    border-radius: 15px;
                    padding: 15px;
                    margin: 10px 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .buy-button {
                    background: #4CAF50;
                    border: none;
                    border-radius: 10px;
                    padding: 10px 20px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .buy-button:hover {
                    background: #45a049;
                }

                .floating-text {
                    position: fixed;
                    font-size: 24px;
                    font-weight: bold;
                    pointer-events: none;
                    z-index: 10002;
                    animation: floatUp 2s ease-out;
                }

                @keyframes floatUp {
                    0% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-50px);
                    }
                }

                .notification {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px 40px;
                    border-radius: 15px;
                    font-size: 20px;
                    font-weight: bold;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    z-index: 10003;
                    animation: slideIn 0.5s ease-out;
                }

                @keyframes slideIn {
                    from {
                        transform: translate(-50%, -150%);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, -50%);
                        opacity: 1;
                    }
                }

                .battle-pass-bar {
                    background: #333;
                    border-radius: 10px;
                    height: 30px;
                    position: relative;
                    overflow: hidden;
                    margin: 10px 0;
                }

                .battle-pass-progress {
                    background: linear-gradient(90deg, #4CAF50, #8BC34A);
                    height: 100%;
                    transition: width 0.5s ease;
                }

                .battle-pass-tier {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-weight: bold;
                }
            </style>

            <div class="currency-display">
                <div class="currency-item">
                    <span class="currency-icon">💎</span>
                    <span id="gem-count">0</span>
                    <button class="add-button" onclick="monetization.showShop()">+</button>
                </div>
                <div class="currency-item">
                    <span class="currency-icon">💰</span>
                    <span id="money-count">0</span>
                </div>
                <div id="vip-indicator"></div>
            </div>

            <div class="lives-display">
                <span class="currency-icon">❤️</span>
                <span id="lives-count">5/5</span>
                <span id="life-timer" class="life-timer"></span>
            </div>

            <button class="shop-button" onclick="monetization.showShop()">🛍️</button>
        `;

        document.body.appendChild(uiContainer);
        this.updateUI();
    }

    updateUI() {
        const gemCount = document.getElementById('gem-count');
        const moneyCount = document.getElementById('money-count');
        const livesCount = document.getElementById('lives-count');
        const lifeTimer = document.getElementById('life-timer');
        const vipIndicator = document.getElementById('vip-indicator');

        if (gemCount) gemCount.textContent = this.gems;
        if (moneyCount) moneyCount.textContent = window.money || 0;
        if (livesCount) livesCount.textContent = `${this.currentLives}/${this.maxLives}`;

        // Update life timer
        if (this.currentLives < this.maxLives) {
            const timeUntilNext = this.lifeRegenInterval - (Date.now() - this.lastLifeRegenTime);
            const minutes = Math.floor(timeUntilNext / 60000);
            const seconds = Math.floor((timeUntilNext % 60000) / 1000);
            if (lifeTimer) lifeTimer.textContent = `Next in ${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            if (lifeTimer) lifeTimer.textContent = '';
        }

        // Update VIP badge
        if (vipIndicator && this.vipTier > 0) {
            vipIndicator.innerHTML = `<div class="vip-badge">VIP ${this.vipTier}</div>`;
        }
    }

    showShop() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal" onclick="this.parentElement.parentElement.remove()">×</span>
                <h2 style="text-align: center; color: #667eea;">💎 Premium Shop 💎</h2>

                <h3>💎 Gems</h3>
                <div class="shop-item">
                    <span>100 Gems</span>
                    <button class="buy-button" onclick="monetization.purchaseProduct('${this.products.gems100.id}')">$0.99</button>
                </div>
                <div class="shop-item">
                    <span>550 Gems <span style="color: #4CAF50;">(+10% bonus)</span></span>
                    <button class="buy-button" onclick="monetization.purchaseProduct('${this.products.gems550.id}')">$4.99</button>
                </div>
                <div class="shop-item">
                    <span>1200 Gems <span style="color: #4CAF50;">(+20% bonus)</span></span>
                    <button class="buy-button" onclick="monetization.purchaseProduct('${this.products.gems1200.id}')">$9.99</button>
                </div>
                <div class="shop-item">
                    <span>2500 Gems <span style="color: #4CAF50;">(+25% bonus)</span></span>
                    <button class="buy-button" onclick="monetization.purchaseProduct('${this.products.gems2500.id}')">$19.99</button>
                </div>
                <div class="shop-item">
                    <span>6500 Gems <span style="color: #FFD700;">(BEST VALUE +30%)</span></span>
                    <button class="buy-button" onclick="monetization.purchaseProduct('${this.products.gems6500.id}')">$49.99</button>
                </div>

                <h3>🎁 Special Packs</h3>
                <div class="shop-item">
                    <span><b>Starter Pack</b><br>300 💎 + $5000 + Tesla Coil</span>
                    <button class="buy-button" onclick="monetization.purchaseProduct('${this.products.starterPack.id}')">$2.99</button>
                </div>
                <div class="shop-item">
                    <span><b>Value Pack</b><br>1000 💎 + $15000 + Quantum Tower</span>
                    <button class="buy-button" onclick="monetization.purchaseProduct('${this.products.valuePack.id}')">$9.99</button>
                </div>
                <div class="shop-item">
                    <span><b>Mega Pack</b><br>3000 💎 + $50000 + Omega Cannon</span>
                    <button class="buy-button" onclick="monetization.purchaseProduct('${this.products.megaPack.id}')">$29.99</button>
                </div>

                <h3>⚔️ Battle Pass</h3>
                <div class="shop-item">
                    <span><b>Season ${this.battlePass.season} Battle Pass</b><br>30 tiers of exclusive rewards!</span>
                    <button class="buy-button" onclick="monetization.purchaseProduct('${this.products.battlePass.id}')">${this.battlePass.active ? 'Active' : '$9.99'}</button>
                </div>

                <h3>👑 VIP Membership</h3>
                <div class="shop-item">
                    <span><b>VIP Bronze</b><br>+25% money/XP, 10 daily gems</span>
                    <button class="buy-button" onclick="monetization.purchaseProduct('${this.products.vip1.id}')">$4.99/mo</button>
                </div>
                <div class="shop-item">
                    <span><b>VIP Silver</b><br>+50% money/XP, 25 daily gems</span>
                    <button class="buy-button" onclick="monetization.purchaseProduct('${this.products.vip2.id}')">$9.99/mo</button>
                </div>
                <div class="shop-item">
                    <span><b>VIP Gold</b><br>+100% money/XP, 50 daily gems</span>
                    <button class="buy-button" onclick="monetization.purchaseProduct('${this.products.vip3.id}')">$19.99/mo</button>
                </div>

                <h3>🎰 Loot Boxes</h3>
                <div class="shop-item">
                    <span><b>Standard Box</b><br>Random tower (65% common)</span>
                    <button class="buy-button" onclick="monetization.openLootBox('standard')">100 💎</button>
                </div>
                <div class="shop-item">
                    <span><b>Premium Box</b><br>Better odds (1.5x rare+)</span>
                    <button class="buy-button" onclick="monetization.openLootBox('premium')">250 💎</button>
                </div>
                <div class="shop-item">
                    <span><b>Mega Box</b><br>Best odds (2x rare+)</span>
                    <button class="buy-button" onclick="monetization.openLootBox('mega')">500 💎</button>
                </div>

                <h3>🚫 Remove Ads</h3>
                <div class="shop-item">
                    <span>Remove all ads forever</span>
                    <button class="buy-button" onclick="monetization.purchaseProduct('${this.products.removeAds.id}')">${this.adsEnabled ? '$4.99' : 'Purchased'}</button>
                </div>

                <h3>📺 Watch Ads for Rewards</h3>
                <div class="shop-item">
                    <span>Double Money (5 min)</span>
                    <button class="buy-button" onclick="monetization.showRewardedAd('doubleMoney')">Watch Ad</button>
                </div>
                <div class="shop-item">
                    <span>2x Speed (3 min)</span>
                    <button class="buy-button" onclick="monetization.showRewardedAd('speedBoost')">Watch Ad</button>
                </div>
                <div class="shop-item">
                    <span>+1 Life</span>
                    <button class="buy-button" onclick="monetization.showRewardedAd('extraLife')">Watch Ad</button>
                </div>
                <div class="shop-item">
                    <span>+5 Gems</span>
                    <button class="buy-button" onclick="monetization.showRewardedAd('gems')">Watch Ad</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showFloatingText(text, color = '#fff') {
        const float = document.createElement('div');
        float.className = 'floating-text';
        float.style.color = color;
        float.textContent = text;
        float.style.left = '50%';
        float.style.top = '50%';

        document.body.appendChild(float);

        setTimeout(() => float.remove(), 2000);
    }

    showNotification(text) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = text;

        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }

    showInsufficientGemsModal() {
        this.showNotification('Not enough gems! Visit the shop to get more.');
        this.showShop();
    }

    showNoLivesModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <h2 style="text-align: center; color: #f5576c;">❌ Out of Lives!</h2>
                <p style="text-align: center;">You need lives to continue playing.</p>

                <div class="shop-item">
                    <span>Refill Lives (5 lives)</span>
                    <button class="buy-button" onclick="monetization.refillLives()">50 💎</button>
                </div>

                <div class="shop-item">
                    <span>Watch Ad for +1 Life</span>
                    <button class="buy-button" onclick="monetization.showRewardedAd('extraLife'); this.parentElement.parentElement.parentElement.remove()">Watch Ad</button>
                </div>

                <p style="text-align: center; color: #999;">Lives regenerate every 30 minutes</p>

                <button class="buy-button" style="width: 100%; margin-top: 20px;" onclick="this.parentElement.parentElement.remove()">Close</button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    refillLives() {
        if (this.spendGems(50, 'refill_lives')) {
            this.currentLives = this.maxLives;
            this.saveLives();
            this.updateUI();
            this.showNotification('Lives refilled!');

            // Close modal
            const modal = document.querySelector('.modal');
            if (modal) modal.remove();
        }
    }

    showDailyRewardModal(reward, streak) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <h2 style="text-align: center; color: #667eea;">🎁 Daily Login Reward!</h2>
                <h3 style="text-align: center;">Day ${streak} Streak!</h3>

                <div style="text-align: center; font-size: 48px; margin: 20px;">
                    💎 ${reward.gems} Gems<br>
                    💰 ${reward.coins} Coins
                    ${reward.tower ? '<br>🎁 Bonus Tower!' : ''}
                </div>

                <p style="text-align: center; color: #999;">Come back tomorrow for more rewards!</p>

                <button class="buy-button" style="width: 100%; margin-top: 20px;" onclick="this.parentElement.parentElement.remove()">Claim!</button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showLootBoxAnimation(tower, rarity) {
        const rarityColors = {
            common: '#999',
            rare: '#4169E1',
            epic: '#9932CC',
            legendary: '#FFD700'
        };

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="text-align: center;">
                <h2 style="color: ${rarityColors[rarity]};">🎰 ${rarity.toUpperCase()} TOWER!</h2>

                <div style="font-size: 72px; margin: 30px; animation: spin 1s ease-in-out;">
                    🗼
                </div>

                <h3>${tower}</h3>

                <button class="buy-button" style="width: 100%; margin-top: 20px;" onclick="this.parentElement.parentElement.remove()">Awesome!</button>
            </div>

            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg) scale(0.5); opacity: 0; }
                    50% { transform: rotate(180deg) scale(1.2); }
                    100% { transform: rotate(360deg) scale(1); opacity: 1; }
                }
            </style>
        `;

        document.body.appendChild(modal);
    }

    showAdModal(callback) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="text-align: center;">
                <h2>📺 Loading Ad...</h2>
                <div style="font-size: 48px; margin: 30px;">⏳</div>
                <p>Simulating ad display (5 seconds)</p>
                <div class="battle-pass-bar" style="margin: 20px auto; width: 80%;">
                    <div class="battle-pass-progress" id="ad-progress" style="width: 0%;"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Simulate ad timer
        let progress = 0;
        const interval = setInterval(() => {
            progress += 20;
            document.getElementById('ad-progress').style.width = `${progress}%`;

            if (progress >= 100) {
                clearInterval(interval);
                modal.remove();
                callback();
            }
        }, 1000);
    }

    // Storage Functions
    loadGems() { return parseInt(localStorage.getItem('gems')) || 0; }
    saveGems() { localStorage.setItem('gems', this.gems); }

    loadAdsEnabled() { return localStorage.getItem('adsEnabled') !== 'false'; }
    saveAdsEnabled() { localStorage.setItem('adsEnabled', this.adsEnabled); }

    loadLives() { return parseInt(localStorage.getItem('lives')) || 5; }
    saveLives() { localStorage.setItem('lives', this.currentLives); }

    loadLastRegenTime() { return parseInt(localStorage.getItem('lastRegenTime')) || Date.now(); }
    saveLastRegenTime() { localStorage.setItem('lastRegenTime', this.lastLifeRegenTime); }

    loadBattlePass() {
        const saved = localStorage.getItem('battlePass');
        return saved ? JSON.parse(saved) : null;
    }
    saveBattlePass() { localStorage.setItem('battlePass', JSON.stringify(this.battlePass)); }

    loadVIPTier() { return parseInt(localStorage.getItem('vipTier')) || 0; }
    loadVIPExpiry() { return parseInt(localStorage.getItem('vipExpiry')) || 0; }
    saveVIP() {
        localStorage.setItem('vipTier', this.vipTier);
        localStorage.setItem('vipExpiry', this.vipExpiry);
    }

    loadLoginStreak() { return parseInt(localStorage.getItem('loginStreak')) || 0; }
    loadLastLogin() { return localStorage.getItem('lastLogin'); }
    saveLoginData() {
        localStorage.setItem('loginStreak', this.currentLoginStreak);
        localStorage.setItem('lastLogin', this.lastLoginDate);
    }

    claimBattlePassReward(reward) {
        if (!reward) return;

        if (reward.premium && this.battlePass.active) {
            if (reward.premium.type === 'gems') {
                this.addGems(reward.premium.amount, 'battle_pass');
            } else if (reward.premium.type === 'tower') {
                this.addTowerToInventory(this.getRandomTowerByRarity(reward.premium.rarity));
            }
        }

        if (reward.free) {
            if (reward.free.type === 'coins') {
                window.money += reward.free.amount;
            }
        }
    }

    addTowerToInventory(tower) {
        // Store in local storage
        const inventory = JSON.parse(localStorage.getItem('towerInventory') || '[]');
        inventory.push(tower);
        localStorage.setItem('towerInventory', JSON.stringify(inventory));

        this.showNotification(`New Tower: ${tower}!`);
    }

    trackEvent(eventName, params) {
        // In real implementation, this would send to analytics
        console.log('Analytics Event:', eventName, params);
    }
}

// Initialize monetization system when game loads
window.monetization = new MonetizationSystem();

// Hook into game loop for updates
if (window.gameLoop) {
    const originalGameLoop = window.gameLoop;
    window.gameLoop = function() {
        originalGameLoop.apply(this, arguments);

        // Update monetization UI
        if (window.monetization) {
            window.monetization.updateUI();
            window.monetization.checkVIPExpiry();
        }
    };
}

// Hook into enemy kills for rewards
if (window.onEnemyKilled) {
    const originalOnEnemyKilled = window.onEnemyKilled;
    window.onEnemyKilled = function(enemy) {
        originalOnEnemyKilled.apply(this, arguments);

        // Give battle pass XP
        if (window.monetization && window.monetization.battlePass.active) {
            window.monetization.addBattlePassXP(enemy.reward || 10);
        }

        // Apply VIP money multiplier
        if (window.monetization && window.monetization.vipTier > 0) {
            const benefits = window.monetization.getVIPBenefits();
            window.money *= benefits.moneyMultiplier;
        }
    };
}

// Export for use in game
window.MonetizationSystem = MonetizationSystem;