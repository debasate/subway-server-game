// ================================
// COOKIE CLICKER GAME
// ================================

console.log('🍪 Loading Cookie Clicker...');

// Game State
let gameState = {
    cookies: 0,
    totalCookies: 0,
    sessionCookies: 0,
    handMadeCookies: 0,
    cookiesPerSecond: 0,
    cookiesPerClick: 1,
    lastSave: Date.now()
};

// Buildings Data
let buildings = [
    {
        id: 'cursor',
        name: 'Cursor',
        icon: '👆',
        description: 'Autoclicks once every 10 seconds',
        baseCost: 15,
        cost: 15,
        cps: 0.1,
        owned: 0,
        unlocked: true
    },
    {
        id: 'grandma',
        name: 'Grandma',
        icon: '👵',
        description: 'A nice grandma to bake more cookies',
        baseCost: 100,
        cost: 100,
        cps: 1,
        owned: 0,
        unlocked: false
    },
    {
        id: 'farm',
        name: 'Cookie Farm',
        icon: '🚜',
        description: 'Grows cookie plants',
        baseCost: 1100,
        cost: 1100,
        cps: 8,
        owned: 0,
        unlocked: false
    },
    {
        id: 'mine',
        name: 'Cookie Mine',
        icon: '⛏️',
        description: 'Mines cookie dough from underground',
        baseCost: 12000,
        cost: 12000,
        cps: 47,
        owned: 0,
        unlocked: false
    },
    {
        id: 'factory',
        name: 'Cookie Factory',
        icon: '🏭',
        description: 'Produces large quantities of cookies',
        baseCost: 130000,
        cost: 130000,
        cps: 260,
        owned: 0,
        unlocked: false
    },
    {
        id: 'bank',
        name: 'Cookie Bank',
        icon: '🏦',
        description: 'Generates cookies from interest',
        baseCost: 1400000,
        cost: 1400000,
        cps: 1400,
        owned: 0,
        unlocked: false
    },
    {
        id: 'temple',
        name: 'Cookie Temple',
        icon: '🏛️',
        description: 'Full of precious cookies',
        baseCost: 20000000,
        cost: 20000000,
        cps: 7800,
        owned: 0,
        unlocked: false
    },
    {
        id: 'spaceship',
        name: 'Cookie Spaceship',
        icon: '🚀',
        description: 'Brings cookies from space',
        baseCost: 330000000,
        cost: 330000000,
        cps: 44000,
        owned: 0,
        unlocked: false
    }
];

// Upgrades Data
let upgrades = [
    {
        id: 'reinforced_cursor',
        name: 'Reinforced Cursors',
        icon: '💪',
        description: 'Cursors are twice as efficient',
        cost: 100,
        unlocked: false,
        purchased: false,
        requirement: () => buildings.find(b => b.id === 'cursor').owned >= 1,
        effect: () => {
            buildings.find(b => b.id === 'cursor').cps *= 2;
        }
    },
    {
        id: 'golden_touch',
        name: 'Golden Touch',
        icon: '✨',
        description: 'Clicking is 50% more efficient',
        cost: 500,
        unlocked: false,
        purchased: false,
        requirement: () => gameState.handMadeCookies >= 100,
        effect: () => {
            gameState.cookiesPerClick *= 1.5;
        }
    },
    {
        id: 'cookie_recipe',
        name: 'Better Cookie Recipe',
        icon: '📜',
        description: 'Grandmas are twice as efficient',
        cost: 1000,
        unlocked: false,
        purchased: false,
        requirement: () => buildings.find(b => b.id === 'grandma').owned >= 1,
        effect: () => {
            buildings.find(b => b.id === 'grandma').cps *= 2;
        }
    },
    {
        id: 'sugar_rush',
        name: 'Sugar Rush',
        icon: '🍬',
        description: 'All buildings produce 10% more',
        cost: 10000,
        unlocked: false,
        purchased: false,
        requirement: () => gameState.totalCookies >= 1000,
        effect: () => {
            buildings.forEach(building => building.cps *= 1.1);
        }
    }
];

// --- Extra Upgrades ---
upgrades.push(
    {
        id: 'cookie_factory',
        name: 'Cookie Factory',
        icon: '🏭',
        description: 'Farms and mines produce 50% more',
        cost: 50000,
        unlocked: false,
        purchased: false,
        requirement: () => buildings.find(b => b.id === 'farm').owned >= 5 && buildings.find(b => b.id === 'mine').owned >= 2,
        effect: () => {
            buildings.find(b => b.id === 'farm').cps *= 1.5;
            buildings.find(b => b.id === 'mine').cps *= 1.5;
        }
    },
    {
        id: 'cookie_god',
        name: 'Cookie God',
        icon: '🦸‍♂️',
        description: 'All cookies per click doubled',
        cost: 250000,
        unlocked: false,
        purchased: false,
        requirement: () => gameState.cookiesPerClick >= 10,
        effect: () => {
            gameState.cookiesPerClick *= 2;
        }
    },
    {
        id: 'space_bakery',
        name: 'Space Bakery',
        icon: '🪐',
        description: 'Spaceships produce 100% more',
        cost: 1000000,
        unlocked: false,
        purchased: false,
        requirement: () => buildings.find(b => b.id === 'spaceship') && buildings.find(b => b.id === 'spaceship').owned >= 1,
        effect: () => {
            buildings.find(b => b.id === 'spaceship').cps *= 2;
        }
    },
    {
        id: 'cookie_rain',
        name: 'Cookie Rain',
        icon: '🌧️',
        description: 'All buildings produce 25% more',
        cost: 5000000,
        unlocked: false,
        purchased: false,
        requirement: () => gameState.totalCookies >= 100000,
        effect: () => {
            buildings.forEach(building => building.cps *= 1.25);
        }
    },
    {
        id: 'ultimate_recipe',
        name: 'Ultimate Recipe',
        icon: '🥇',
        description: 'Grandmas and farms produce 100% more',
        cost: 20000000,
        unlocked: false,
        purchased: false,
        requirement: () => buildings.find(b => b.id === 'grandma').owned >= 10 && buildings.find(b => b.id === 'farm').owned >= 10,
        effect: () => {
            buildings.find(b => b.id === 'grandma').cps *= 2;
            buildings.find(b => b.id === 'farm').cps *= 2;
        }
    }
);

// Achievements Data
let achievements = [
    {
        id: 'first_cookie',
        name: 'First Cookie',
        icon: '🍪',
        description: 'Bake your first cookie',
        unlocked: false,
        requirement: () => gameState.totalCookies >= 1
    },
    {
        id: 'hundred_cookies',
        name: 'Cookie Monster',
        icon: '👹',
        description: 'Bake 100 cookies',
        unlocked: false,
        requirement: () => gameState.totalCookies >= 100
    },
    {
        id: 'thousand_cookies',
        name: 'Cookie Lord',
        icon: '👑',
        description: 'Bake 1,000 cookies',
        unlocked: false,
        requirement: () => gameState.totalCookies >= 1000
    },
    {
        id: 'first_building',
        name: 'Getting Help',
        icon: '🏗️',
        description: 'Purchase your first building',
        unlocked: false,
        requirement: () => buildings.some(b => b.owned > 0)
    },
    {
        id: 'ten_buildings',
        name: 'Cookie Empire',
        icon: '🏰',
        description: 'Own 10 buildings total',
        unlocked: false,
        requirement: () => buildings.reduce((sum, b) => sum + b.owned, 0) >= 10
    },
    {
        id: 'fast_clicker',
        name: 'Fast Fingers',
        icon: '⚡',
        description: 'Make 100 cookies by hand',
        unlocked: false,
        requirement: () => gameState.handMadeCookies >= 100
    }
];

// DOM Elements
const bigCookie = document.getElementById('big-cookie');
const cookieCount = document.getElementById('cookie-count');
const cpsDisplay = document.getElementById('cps');
const clickEffects = document.getElementById('click-effects');
const shopContainer = document.getElementById('shop-container');
const upgradesContainer = document.getElementById('upgrades-container');
const achievementsContainer = document.getElementById('achievements-container');

// Stats elements
const totalCookiesEl = document.getElementById('total-cookies');
const sessionCookiesEl = document.getElementById('session-cookies');
const handMadeEl = document.getElementById('hand-made');
const perClickEl = document.getElementById('per-click');

// Cookie Click Handler
function clickCookie(event) {
    let clickPower = Math.floor(gameState.cookiesPerClick);

    // Apply Wednesday Coin Boost if available
    if (window.applyWednesdayBoost) {
        clickPower = window.applyWednesdayBoost(clickPower);
    }

    gameState.cookies += clickPower;
    gameState.totalCookies += clickPower;
    gameState.sessionCookies += clickPower;
    gameState.handMadeCookies += clickPower;

    // Create click effect
    createClickEffect(event, clickPower);

    // Cookie animation
    bigCookie.style.transform = 'scale(0.95)';
    setTimeout(() => {
        bigCookie.style.transform = 'scale(1)';
    }, 100);

    // Play sound effect (if available)
    playClickSound();

    updateDisplay();
    saveGame();
}

// Create click effect animation
function createClickEffect(event, amount) {
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = `+${formatNumber(amount)}`;

    // Position relative to click
    const rect = bigCookie.getBoundingClientRect();
    const x = event ? (event.clientX - rect.left) : rect.width / 2;
    const y = event ? (event.clientY - rect.top) : rect.height / 2;

    effect.style.left = x + 'px';
    effect.style.top = y + 'px';

    clickEffects.appendChild(effect);

    // Remove after animation
    setTimeout(() => {
        if (effect.parentNode) {
            effect.parentNode.removeChild(effect);
        }
    }, 1000);
}

// Buy Building
function buyBuilding(buildingId) {
    const building = buildings.find(b => b.id === buildingId);

    if (gameState.cookies >= building.cost) {
        gameState.cookies -= building.cost;
        building.owned++;

        // Update cost (increases by 15% each purchase)
        building.cost = Math.ceil(building.baseCost * Math.pow(1.15, building.owned));

        updateCPS();
        updateDisplay();
        updateShop();
        checkUpgrades();
        saveGame();

        console.log(`🏗️ Bought ${building.name}! Now owned: ${building.owned}`);
    }
}

// Buy Upgrade
function buyUpgrade(upgradeId) {
    console.log(`🛒 Attempting to buy upgrade: ${upgradeId}`);

    const upgrade = upgrades.find(u => u.id === upgradeId);

    if (!upgrade) {
        console.error(`❌ Upgrade not found: ${upgradeId}`);
        return;
    }

    console.log(`💰 Current cookies: ${gameState.cookies}, Upgrade cost: ${upgrade.cost}, Already purchased: ${upgrade.purchased}`);

    if (gameState.cookies >= upgrade.cost && !upgrade.purchased) {
        gameState.cookies -= upgrade.cost;
        upgrade.purchased = true;

        // Apply the upgrade effect
        try {
            upgrade.effect();
            console.log(`✅ Applied effect for upgrade: ${upgrade.name}`);
        } catch (error) {
            console.error(`❌ Error applying upgrade effect:`, error);
        }

        updateCPS();
        updateDisplay();
        updateUpgrades();
        saveGame();

        console.log(`⬆️ Successfully bought upgrade: ${upgrade.name}`);

        // Show visual feedback
        showUpgradePurchaseEffect(upgrade);
    } else {
        if (upgrade.purchased) {
            console.log(`⚠️ Upgrade ${upgrade.name} already purchased`);
        } else {
            console.log(`⚠️ Not enough cookies for ${upgrade.name}. Need ${upgrade.cost - gameState.cookies} more`);
        }
    }
}

// Update CPS calculation
function updateCPS() {
    gameState.cookiesPerSecond = buildings.reduce((total, building) => {
        return total + (building.cps * building.owned);
    }, 0);
}

// Format numbers for display
function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

// Update Display
function updateDisplay() {
    cookieCount.textContent = formatNumber(gameState.cookies);
    cpsDisplay.textContent = formatNumber(gameState.cookiesPerSecond);

    // Update stats
    totalCookiesEl.textContent = formatNumber(gameState.totalCookies);
    sessionCookiesEl.textContent = formatNumber(gameState.sessionCookies);
    handMadeEl.textContent = formatNumber(gameState.handMadeCookies);
    perClickEl.textContent = formatNumber(gameState.cookiesPerClick);

    // Update shop and upgrades real-time (only visual states, not full rebuild)
    updateShopVisualStates();
    updateUpgradeVisualStates();
}

// Update only the visual states of shop items (faster than full rebuild)
function updateShopVisualStates() {
    buildings.forEach(building => {
        if (!building.unlocked) return;

        const shopItem = document.querySelector(`[data-building-id="${building.id}"]`);
        if (!shopItem) {
            // Item doesn't exist, trigger full rebuild
            updateShop();
            return;
        }

        const canBuy = gameState.cookies >= building.cost;

        // Update classes
        shopItem.classList.remove('affordable', 'too-expensive');
        shopItem.classList.add(canBuy ? 'affordable' : 'too-expensive');

        // Update status indicator
        const statusElement = shopItem.querySelector('.buy-indicator, .too-expensive-indicator');
        if (statusElement) {
            statusElement.className = canBuy ? 'buy-indicator' : 'too-expensive-indicator';
            statusElement.textContent = canBuy ? 'BUY!' : 'Too expensive';
            console.log(`Updated ${building.name}: canBuy=${canBuy}, cookies=${gameState.cookies}, cost=${building.cost}`);
        }

        // Update or add progress bar
        let progressContainer = shopItem.querySelector('.progress-bar-container');
        if (!canBuy) {
            const progressPercent = Math.min((gameState.cookies / building.cost) * 100, 100);

            if (progressContainer) {
                // Update existing progress bar
                const progressFill = progressContainer.querySelector('.progress-bar-fill');
                if (progressFill) {
                    progressFill.style.width = progressPercent + '%';
                }
            } else {
                // Add new progress bar
                const shopInfo = shopItem.querySelector('.shop-info');
                if (shopInfo) {
                    const progressHTML = `<div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
                     </div>`;
                    shopInfo.insertAdjacentHTML('beforeend', progressHTML);
                }
            }
        } else if (progressContainer) {
            // Remove progress bar when affordable
            progressContainer.remove();
        }
    });
}

// Update only the visual states of upgrade items
function updateUpgradeVisualStates() {
    upgrades.forEach(upgrade => {
        if (!upgrade.unlocked || upgrade.purchased) return;

        const upgradeItem = document.querySelector(`[data-upgrade-id="${upgrade.id}"]`);
        if (!upgradeItem) {
            // Item doesn't exist, trigger full rebuild
            updateUpgrades();
            return;
        }

        const canBuy = gameState.cookies >= upgrade.cost;

        // Update classes
        upgradeItem.classList.remove('affordable', 'too-expensive');
        upgradeItem.classList.add(canBuy ? 'affordable' : 'too-expensive');

        // Update status indicator
        const statusElement = upgradeItem.querySelector('.buy-indicator, .too-expensive-indicator');
        if (statusElement) {
            statusElement.className = canBuy ? 'buy-indicator' : 'too-expensive-indicator';
            statusElement.textContent = canBuy ? 'BUY!' : 'Too expensive';
        }
    });
}

// Update Shop
function updateShop() {
    shopContainer.innerHTML = '';

    buildings.forEach(building => {
        // Check if building should be unlocked
        if (!building.unlocked && gameState.totalCookies >= building.baseCost / 10) {
            building.unlocked = true;
        }

        if (building.unlocked) {
            const shopItem = document.createElement('div');
            shopItem.className = 'shop-item';
            shopItem.dataset.buildingId = building.id; // Add identifier

            if (gameState.cookies >= building.cost) {
                shopItem.classList.add('affordable');
            } else {
                shopItem.classList.add('too-expensive');
            }

            const canBuy = gameState.cookies >= building.cost;
            const progressPercent = Math.min((gameState.cookies / building.cost) * 100, 100);
            const statusIndicator = canBuy ?
                '<div class="buy-indicator">BUY!</div>' :
                '<div class="too-expensive-indicator">Too expensive</div>';

            const progressBar = !canBuy ?
                `<div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
                 </div>` : '';

            shopItem.innerHTML = `
                <div class="shop-icon">${building.icon}</div>
                <div class="shop-info">
                    <div class="shop-name">${building.name}</div>
                    <div class="shop-description">${building.description}</div>
                    <div class="shop-owned">Owned: ${building.owned}</div>
                    ${progressBar}
                </div>
                <div class="shop-price-section">
                    <div class="shop-price">${formatNumber(building.cost)}</div>
                    ${statusIndicator}
                </div>
            `;

            shopItem.addEventListener('click', () => {
                if (gameState.cookies >= building.cost) {
                    buyBuilding(building.id);
                } else {
                    // Visual feedback for insufficient funds
                    shopItem.style.animation = 'shake 0.5s ease-in-out';
                    setTimeout(() => {
                        shopItem.style.animation = '';
                    }, 500);
                }
            });
            shopContainer.appendChild(shopItem);
        }
    });
}

// Check and update upgrades
function checkUpgrades() {
    upgrades.forEach(upgrade => {
        if (!upgrade.unlocked && upgrade.requirement()) {
            upgrade.unlocked = true;
        }
    });
    updateUpgrades();
}

// Update Upgrades Display
function updateUpgrades() {
    upgradesContainer.innerHTML = '';

    upgrades.forEach(upgrade => {
        if (upgrade.unlocked && !upgrade.purchased) {
            const upgradeItem = document.createElement('div');
            upgradeItem.className = 'upgrade-item';
            upgradeItem.dataset.upgradeId = upgrade.id; // Add identifier

            if (gameState.cookies >= upgrade.cost) {
                upgradeItem.classList.add('affordable');
            } else {
                upgradeItem.classList.add('too-expensive');
            }

            const canBuyUpgrade = gameState.cookies >= upgrade.cost;
            const progressPercent = Math.min((gameState.cookies / upgrade.cost) * 100, 100);
            const statusIndicator = canBuyUpgrade ?
                '<div class="buy-indicator">BUY!</div>' :
                '<div class="too-expensive-indicator">Too expensive</div>';

            const progressBar = !canBuyUpgrade ?
                `<div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
                 </div>` : '';

            upgradeItem.innerHTML = `
                <div class="upgrade-icon">${upgrade.icon}</div>
                <div class="upgrade-name">${upgrade.name}</div>
                <div class="upgrade-description">${upgrade.description}</div>
                ${progressBar}
                <div class="upgrade-price">${formatNumber(upgrade.cost)}</div>
                ${statusIndicator}
            `;

            upgradeItem.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                console.log(`🖱️ Upgrade item clicked: ${upgrade.id}`);
                console.log(`💰 Current cookies: ${gameState.cookies}, Required: ${upgrade.cost}`);

                if (gameState.cookies >= upgrade.cost && !upgrade.purchased) {
                    console.log(`✅ Purchase conditions met, buying upgrade...`);
                    buyUpgrade(upgrade.id);
                } else {
                    console.log(`❌ Cannot buy upgrade - cookies: ${gameState.cookies}, cost: ${upgrade.cost}, purchased: ${upgrade.purchased}`);
                    // Visual feedback for insufficient funds
                    upgradeItem.style.animation = 'shake 0.5s ease-in-out';
                    setTimeout(() => {
                        upgradeItem.style.animation = '';
                    }, 500);
                }
            });
            upgradesContainer.appendChild(upgradeItem);
        }
    });
}

// Check Achievements
function checkAchievements() {
    achievements.forEach(achievement => {
        if (!achievement.unlocked && achievement.requirement()) {
            achievement.unlocked = true;
            showAchievementNotification(achievement);
        }
    });
    updateAchievements();
}

// Update Achievements Display
function updateAchievements() {
    achievementsContainer.innerHTML = '';

    achievements.forEach(achievement => {
        const achievementItem = document.createElement('div');
        achievementItem.className = 'achievement-item';

        if (achievement.unlocked) {
            achievementItem.classList.add('unlocked');
        } else {
            achievementItem.classList.add('locked');
        }

        achievementItem.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-description">${achievement.description}</div>
        `;

        achievementsContainer.appendChild(achievementItem);
    });
}

// Show achievement notification
function showAchievementNotification(achievement) {
    console.log(`🏆 Achievement unlocked: ${achievement.name}`);

    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #FFD700, #FFA500);
        color: #000;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.5s ease-out;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    notification.innerHTML = `
        <div style="font-size: 1.2em;">🏆 Achievement Unlocked!</div>
        <div style="margin-top: 5px;">${achievement.icon} ${achievement.name}</div>
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
                notification.parentNode.removeChild(notification);
            }, 500);
        }
    }, 3000);
}

// Show upgrade purchase effect
function showUpgradePurchaseEffect(upgrade) {
    console.log(`⬆️ Showing purchase effect for: ${upgrade.name}`);

    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #90EE90, #32CD32);
        color: #000;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.5s ease-out;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    notification.innerHTML = `
        <div style="font-size: 1.2em;">⬆️ Upgrade Purchased!</div>
        <div style="margin-top: 5px;">${upgrade.icon} ${upgrade.name}</div>
    `;

    document.body.appendChild(notification);

    // Remove after 2 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
                notification.parentNode.removeChild(notification);
            }, 500);
        }
    }, 2000);
}

// Play click sound (placeholder)
function playClickSound() {
    // Could add audio here
    // const audio = new Audio('click-sound.mp3');
    // audio.play();
}

// Save Game
function saveGame() {
    const saveData = {
        gameState: gameState,
        buildings: buildings,
        upgrades: upgrades,
        achievements: achievements,
        timestamp: Date.now()
    };

    localStorage.setItem('cookieClickerSave', JSON.stringify(saveData));

    // Submit score to online leaderboard if user is logged in
    try {
        if (typeof window.submitScore === 'function') {
            // Get current user info
            let username = 'Guest';
            if (window.currentUser && window.currentUser.username) {
                username = window.currentUser.username;
            } else if (localStorage.getItem('currentUser')) {
                const userData = JSON.parse(localStorage.getItem('currentUser'));
                username = userData.username || 'Guest';
            }

            // Only submit if not guest and has meaningful cookies count
            if (username !== 'Guest' && gameState.totalCookies > 0) {
                window.submitScore(username, Math.floor(gameState.totalCookies), 'cookie-clicker');
                console.log(`🌍 Cookie score ${Math.floor(gameState.totalCookies)} submitted to online leaderboard for ${username}`);

                // Send Discord notification for milestone cookies (>1000 total)
                if (gameState.totalCookies > 1000 && typeof window.sendGameplayNotification === 'function') {
                    window.sendGameplayNotification('Cookie Clicker', Math.floor(gameState.totalCookies), Math.floor(gameState.cookies));
                }
            }
        }
    } catch (error) {
        console.warn('⚠️ Failed to submit cookie score to online leaderboard:', error);
    }
}

// Load Game
function loadGame() {
    const saveData = localStorage.getItem('cookieClickerSave');

    if (saveData) {
        try {
            const data = JSON.parse(saveData);

            // Restore game state
            gameState = { ...gameState, ...data.gameState };

            // Restore buildings
            if (data.buildings) {
                buildings = data.buildings;
            }

            // Restore upgrades
            if (data.upgrades) {
                upgrades = data.upgrades;
            }

            // Restore achievements
            if (data.achievements) {
                achievements = data.achievements;
            }

            // Calculate offline progress
            if (data.timestamp) {
                const offlineTime = Math.min((Date.now() - data.timestamp) / 1000, 3600); // Max 1 hour
                const offlineCookies = Math.floor(gameState.cookiesPerSecond * offlineTime);

                if (offlineCookies > 0) {
                    gameState.cookies += offlineCookies;
                    gameState.totalCookies += offlineCookies;
                    gameState.sessionCookies += offlineCookies;

                    console.log(`🍪 Welcome back! You earned ${formatNumber(offlineCookies)} cookies while away!`);
                }
            }

            updateCPS();
            console.log('💾 Game loaded successfully!');
        } catch (error) {
            console.error('❌ Error loading game:', error);
        }
    }
}

// Game Loop
function gameLoop() {
    // Add cookies from CPS
    if (gameState.cookiesPerSecond > 0) {
        let cpsGain = gameState.cookiesPerSecond / 30; // 30 FPS

        // Apply Wednesday Coin Boost if available
        if (window.applyWednesdayBoost) {
            cpsGain = window.applyWednesdayBoost(cpsGain);
        }

        gameState.cookies += cpsGain;
        gameState.totalCookies += cpsGain;
        gameState.sessionCookies += cpsGain;
    }

    updateDisplay();
    checkAchievements();

    // Auto-save every 10 seconds
    if (Date.now() - gameState.lastSave > 10000) {
        saveGame();
        gameState.lastSave = Date.now();
    }
}

// Initialize Game
function initGame() {
    console.log('🍪 Initializing Cookie Clicker...');

    // Load saved game
    loadGame();

    // Set up event listeners
    bigCookie.addEventListener('click', clickCookie);

    // Update displays
    updateDisplay();
    updateShop();
    updateUpgrades();
    updateAchievements();

    // Start game loop (30 FPS)
    setInterval(gameLoop, 1000 / 30);

    console.log('✅ Cookie Clicker initialized successfully!');
}

// Start the game when page loads
document.addEventListener('DOMContentLoaded', initGame);

console.log('🍪 Cookie Clicker loaded successfully!');