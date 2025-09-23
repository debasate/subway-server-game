const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const shopScreen = document.getElementById('shop-screen');
const infinityBtn = document.getElementById('infinity-btn');
const levelBtn = document.getElementById('level-btn');
const shopBtn = document.getElementById('shop-btn');
const shopCloseBtn = document.getElementById('shop-close-btn');
const gameInfo = document.getElementById('game-info');
const modeDisplay = document.getElementById('mode-display');
const levelDisplay = document.getElementById('level-display');
const coinDisplay = document.getElementById('coin-display');
const coinsCount = document.getElementById('coins-count');

let gameRunning = false;
let gameMode = 'infinity'; // 'infinity' or 'level'
let currentLevel = 1;
let levelProgress = 0;
let levelTarget = 1000; // Score needed to complete level

// Player and game state
let player = {
    x: 220, y: 540, w: 40, h: 40, color: '#ff0', lane: 1, lives: 1,
    moveSpeed: 1, // Voor lane switching snelheid
    activeSkin: 'default',
    ghostCharges: 0,
    lastGhostScore: 0
};
let lanes = [120, 220, 320];
let obstacles = [];
let speed = 2; // Start veel langzamer
let score = 0;
let baseSpeed = 2;
let scoreMultiplier = 0.15; // Veel langzamere score toename
let difficultyLevel = 1;

// Notification system
let notifications = [];
let notificationId = 0;

function showNotification(message, type = 'info', duration = 3000) {
    const notification = {
        id: notificationId++,
        message: message,
        type: type, // 'info', 'success', 'warning', 'achievement'
        createdAt: Date.now(),
        duration: duration
    };
    notifications.push(notification);
    
    // Auto remove after duration
    setTimeout(() => {
        notifications = notifications.filter(n => n.id !== notification.id);
    }, duration);
}

function drawNotifications() {
    const currentTime = Date.now();
    
    notifications.forEach((notification, index) => {
        const age = currentTime - notification.createdAt;
        const progress = age / notification.duration;
        const opacity = Math.max(0, 1 - progress);
        
        // Position from center
        const y = canvas.height / 2 - 100 + (index * 60);
        const x = canvas.width / 2;
        
        // Background
        ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * opacity})`;
        ctx.fillRect(x - 150, y - 25, 300, 50);
        
        // Border based on type
        let borderColor = '#4CAF50';
        switch (notification.type) {
            case 'success': borderColor = '#4CAF50'; break;
            case 'warning': borderColor = '#FF9800'; break;
            case 'achievement': borderColor = '#FFD700'; break;
            case 'info': borderColor = '#2196F3'; break;
        }
        
        ctx.strokeStyle = `rgba(${hexToRgb(borderColor)}, ${opacity})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 150, y - 25, 300, 50);
        
        // Text
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(notification.message, x, y + 5);
        ctx.textAlign = 'left';
    });
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '255, 255, 255';
}

// Shield system
let temporaryShield = false;
let shieldTimeLeft = 0;
let lastShieldScore = 0;

// Coin system
let coins = parseInt(localStorage.getItem('subwayCoins') || '0');
let coinsThisRun = 0;

// Shop items and upgrades
let playerUpgrades = JSON.parse(localStorage.getItem('subwayUpgrades') || '{}');
const defaultUpgrades = {
    speed: false,
    shield: false,
    magnet: false,
    goldenSkin: false,
    speedSkin: false,
    ghostSkin: false,
    tankSkin: false,
    rainbowSkin: false
};
playerUpgrades = { ...defaultUpgrades, ...playerUpgrades };

// Shop system
const shopItems = {
    speed: { price: 10, name: "Speed Boost" },
    shield: { price: 25, name: "Shield" },
    magnet: { price: 50, name: "Coin Magnet" },
    goldenSkin: { price: 100, name: "Golden Skin" },
    speedSkin: { price: 150, name: "Speed Demon" },
    ghostSkin: { price: 200, name: "Ghost Mode" },
    tankSkin: { price: 300, name: "Tank Mode" },
    rainbowSkin: { price: 500, name: "Rainbow Power" }
}; function updateCoinDisplay() {
    coinDisplay.textContent = coins;
    coinsCount.textContent = coinsThisRun;
}

function saveProgress() {
    localStorage.setItem('subwayCoins', coins.toString());
    localStorage.setItem('subwayUpgrades', JSON.stringify(playerUpgrades));
}

function updateShopDisplay() {
    Object.keys(shopItems).forEach(item => {
        const shopItem = document.querySelector(`.shop-item[data-item="${item}"]`);
        const buyBtn = shopItem.querySelector('.buy-btn');

        if (playerUpgrades[item]) {
            shopItem.classList.add('owned');
            buyBtn.textContent = 'Eigendom';
            buyBtn.disabled = true;
        } else {
            const canAfford = coins >= shopItems[item].price;
            buyBtn.disabled = !canAfford;
            buyBtn.style.background = canAfford ? '#4CAF50' : '#666';
        }
    });
}

function buyItem(itemName) {
    const item = shopItems[itemName];
    if (coins >= item.price && !playerUpgrades[itemName]) {
        coins -= item.price;
        playerUpgrades[itemName] = true;
        saveProgress();
        updateCoinDisplay();
        updateShopDisplay();
        showNotification(`${item.name} gekocht! 🎉`, '#4ade80');
    }
}

// Event listeners voor shop
shopBtn.onclick = () => {
    startScreen.style.display = 'none';
    shopScreen.style.display = 'block';
    updateShopDisplay();
};

shopCloseBtn.onclick = () => {
    shopScreen.style.display = 'none';
    startScreen.style.display = 'block';
};

document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.onclick = (e) => {
        const item = e.target.getAttribute('data-item');
        buyItem(item);
    };
});

// Level definitions
const levels = [
    { id: 1, name: "Beginner Station", target: 1000, maxSpeed: 6, spawnRate: 0.02 },
    { id: 2, name: "City Junction", target: 2000, maxSpeed: 8, spawnRate: 0.025 },
    { id: 3, name: "Rush Hour", target: 3000, maxSpeed: 10, spawnRate: 0.03 },
    { id: 4, name: "Express Line", target: 4000, maxSpeed: 12, spawnRate: 0.035 },
    { id: 5, name: "Final Terminal", target: 5000, maxSpeed: 15, spawnRate: 0.04 }
];

function resetGame(mode = 'infinity') {
    gameMode = mode;
    player.lane = 1;
    player.x = lanes[player.lane];
    player.y = 540;
    player.lives = playerUpgrades.shield ? 2 : 1;
    player.moveSpeed = 1;
    player.ghostCharges = 0;
    player.lastGhostScore = 0;

    // Bepaal actieve skin
    if (playerUpgrades.rainbowSkin) player.activeSkin = 'rainbow';
    else if (playerUpgrades.tankSkin) player.activeSkin = 'tank';
    else if (playerUpgrades.ghostSkin) player.activeSkin = 'ghost';
    else if (playerUpgrades.speedSkin) player.activeSkin = 'speed';
    else if (playerUpgrades.goldenSkin) player.activeSkin = 'golden';
    else player.activeSkin = 'default';

    // Skin abilities toepassen
    if (player.activeSkin === 'speed' || player.activeSkin === 'rainbow') {
        player.moveSpeed = 1.5;
    }

    obstacles = [];
    score = 0;
    coinsThisRun = 0;
    currentLevel = 1;
    levelProgress = 0;
    difficultyLevel = 1;

    // Reset shield system
    temporaryShield = false;
    shieldTimeLeft = 0;
    lastShieldScore = 0;

    // Zeer easy start
    if (gameMode === 'infinity') {
        speed = playerUpgrades.speed ? 2.4 : 2;
        baseSpeed = speed;
    } else {
        speed = levels[0].maxSpeed * (playerUpgrades.speed ? 0.4 : 0.3);
        baseSpeed = speed;
        levelTarget = levels[0].target;
    }

    updateGameInfo();
    updateCoinDisplay();
}
function updateGameInfo() {
    if (gameMode === 'infinity') {
        modeDisplay.textContent = 'Mode: Infinity';
        levelDisplay.textContent = `Score: ${Math.floor(score)}`;
    } else {
        modeDisplay.textContent = `Mode: Level ${currentLevel}`;
        levelDisplay.textContent = `Progress: ${Math.floor(score)}/${levelTarget}`;
    }
}

function drawPlayer() {
    const { x, y, w, h } = player;
    const time = Date.now() * 0.01;

    // Skin-gebaseerde kleuren en effecten
    const gradient = ctx.createLinearGradient(x, y, x, y + h);

    switch (player.activeSkin) {
        case 'golden':
            gradient.addColorStop(0, '#FFE55C');
            gradient.addColorStop(0.3, '#FFD700');
            gradient.addColorStop(0.7, '#FFC107');
            gradient.addColorStop(1, '#FF8F00');
            break;
        case 'speed':
            // Blauwe speed skin
            gradient.addColorStop(0, '#00BFFF');
            gradient.addColorStop(0.3, '#1E90FF');
            gradient.addColorStop(0.7, '#0080FF');
            gradient.addColorStop(1, '#0066CC');
            break;
        case 'ghost':
            // Paarse ghost skin
            gradient.addColorStop(0, '#E6E6FA');
            gradient.addColorStop(0.3, '#DDA0DD');
            gradient.addColorStop(0.7, '#BA55D3');
            gradient.addColorStop(1, '#8B008B');
            break;
        case 'tank':
            // Groene tank skin
            gradient.addColorStop(0, '#90EE90');
            gradient.addColorStop(0.3, '#32CD32');
            gradient.addColorStop(0.7, '#228B22');
            gradient.addColorStop(1, '#006400');
            break;
        case 'rainbow':
            // Rainbow skin - kleur verandert over tijd
            const hue = (time * 50) % 360;
            const color1 = `hsl(${hue}, 100%, 70%)`;
            const color2 = `hsl(${(hue + 60) % 360}, 100%, 60%)`;
            const color3 = `hsl(${(hue + 120) % 360}, 100%, 50%)`;
            gradient.addColorStop(0, color1);
            gradient.addColorStop(0.5, color2);
            gradient.addColorStop(1, color3);
            break;
        default:
            // Normale geel/goud kleur
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(0.3, '#FFC107');
            gradient.addColorStop(0.7, '#FF9800');
            gradient.addColorStop(1, '#F57C00');
    }

    // Schaduw
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 3, y + 3, w, h);

    // Hoofdlichaam
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);

    // 3D effect - highlight
    const highlightOpacity = ['golden', 'rainbow'].includes(player.activeSkin) ? 0.6 : 0.4;
    ctx.fillStyle = `rgba(255, 255, 255, ${highlightOpacity})`;
    ctx.fillRect(x + 2, y + 2, w - 4, 8);

    // Border kleur per skin
    let borderColor = '#E65100';
    switch (player.activeSkin) {
        case 'golden': borderColor = '#B8860B'; break;
        case 'speed': borderColor = '#0066CC'; break;
        case 'ghost': borderColor = '#8B008B'; break;
        case 'tank': borderColor = '#006400'; break;
        case 'rainbow': borderColor = `hsl(${(time * 100) % 360}, 100%, 30%)`; break;
    }

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Ogen
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 8, y + 10, 4, 4);
    ctx.fillRect(x + 28, y + 10, 4, 4);

    // Skin speciale effecten
    if (player.activeSkin === 'speed' || player.activeSkin === 'rainbow') {
        // Speed trails
        ctx.fillStyle = 'rgba(0, 191, 255, 0.3)';
        ctx.fillRect(x - 10, y + 10, 8, 4);
        ctx.fillRect(x - 15, y + 20, 12, 4);
    }

    if (player.activeSkin === 'ghost' || player.activeSkin === 'rainbow') {
        // Ghost charges indicator
        ctx.fillStyle = '#BA55D3';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`👻${player.ghostCharges}`, x - 5, y - 5);
    }

    if (player.activeSkin === 'tank' || player.activeSkin === 'rainbow') {
        // Tank cannon
        ctx.fillStyle = borderColor;
        ctx.fillRect(x + w, y + h / 2 - 2, 8, 4);
    }

    // Shield indicator als speler permanent shield heeft
    if (player.lives > 1) {
        ctx.strokeStyle = '#00BFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Tijdelijk schild indicator (1000 punten schild)
    if (temporaryShield && shieldTimeLeft > 0) {
        // Animatie effect - pulseren
        const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2 + 8, 0, Math.PI * 2);
        ctx.stroke();

        // Schild timer tekst
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`🛡️${Math.ceil(shieldTimeLeft)}s`, x + w / 2, y - 10);
        ctx.textAlign = 'left';
    }
}

function drawObstacles() {
    obstacles.forEach(obs => {
        const { x, y, w, h } = obs;

        // Rode obstakel met gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, '#F44336');
        gradient.addColorStop(0.5, '#D32F2F');
        gradient.addColorStop(1, '#B71C1C');

        // Schaduw
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x + 2, y + 2, w, h);

        // Hoofdlichaam
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, h);

        // 3D effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x + 2, y + 2, w - 4, 6);

        // Donkere rand voor diepte
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + w - 3, y + 3, 3, h - 3);
        ctx.fillRect(x + 3, y + h - 3, w - 3, 3);

        // Border
        ctx.strokeStyle = '#8E0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Waarschuwingspatroon
        ctx.fillStyle = '#FFEB3B';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + 5 + i * 10, y + 5, 3, 3);
            ctx.fillRect(x + 5 + i * 10, y + h - 8, 3, 3);
        }
    });
}

function drawLevelInfo() {
    if (gameMode === 'level') {
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        const level = levels[currentLevel - 1];
        ctx.fillText(level.name, 10, canvas.height - 20);

        // Progress bar
        const barWidth = 200;
        const barHeight = 10;
        const barX = canvas.width - barWidth - 10;
        const barY = canvas.height - 25;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const progress = Math.min(score / levelTarget, 1);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    }
}

function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    obstacles.push({ x: lanes[lane], y: -60, w: 40, h: 40 });
}

function getDynamicSpawnRate() {
    // Super easy start, wordt geleidelijk moeilijker
    const baseRate = 0.005; // Zeer lage start rate
    const maxRate = 0.05;   // Maximum spawn rate

    // Difficulty increases every 500 points
    const difficultyMultiplier = Math.min(score / 500, 10);
    return Math.min(baseRate + (difficultyMultiplier * 0.005), maxRate);
}

function updateObstacles() {
    for (let obs of obstacles) {
        obs.y += speed;
    }
    obstacles = obstacles.filter(obs => obs.y < canvas.height);
}

function handleTankCollision(obstacle) {
    if (player.activeSkin === 'tank' || player.activeSkin === 'rainbow') {
        // Tank destroys obstacles and gets coins
        coinsThisRun += 2;
        return true; // Obstacle destroyed
    }
    return false;
}

function handleGhostCollision() {
    if ((player.activeSkin === 'ghost' || player.activeSkin === 'rainbow') && player.ghostCharges > 0) {
        player.ghostCharges--;
        return true; // Phase through obstacle
    }
    return false;
}

function checkCollision() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (
            obs.x < player.x + player.w &&
            obs.x + obs.w > player.x &&
            obs.y < player.y + player.h &&
            obs.y + obs.h > player.y
        ) {
            // Check tank ability first
            if (handleTankCollision(obs)) {
                obstacles.splice(i, 1);
                continue;
            }

            // Check ghost ability
            if (handleGhostCollision()) {
                obstacles.splice(i, 1);
                continue;
            }

            return true; // Normal collision
        }
    }
    return false;
}

function updateGameLogic() {
    // Langzamere score toename
    score += scoreMultiplier;

    // Update ghost charges elke 500 punten
    if ((player.activeSkin === 'ghost' || player.activeSkin === 'rainbow')) {
        const currentFiveHundred = Math.floor(score / 500);
        const lastFiveHundred = Math.floor(player.lastGhostScore / 500);

        if (currentFiveHundred > lastFiveHundred) {
            player.ghostCharges++;
            player.lastGhostScore = score;
        }
    }

    // Check voor 1000 punten schild
    const currentThousand = Math.floor(score / 1000);
    const lastThousand = Math.floor(lastShieldScore / 1000);

    if (currentThousand > lastThousand) {
        // Nieuwe 1000 punten bereikt - activeer schild!
        temporaryShield = true;
        shieldTimeLeft = 10; // 10 seconden
        lastShieldScore = score;

        // Visual feedback
        setTimeout(() => {
            showNotification(`🛡️ SCHILD GEACTIVEERD! 🛡️\n10 seconden bescherming!`, '#fbbf24');
        }, 100);
    }

    // Update schild timer
    if (temporaryShield && shieldTimeLeft > 0) {
        shieldTimeLeft -= 1 / 60; // Verminderen per frame (60fps)
        if (shieldTimeLeft <= 0) {
            temporaryShield = false;
            shieldTimeLeft = 0;
        }
    }

    // Coins verdienen (golden skin geeft bonus)
    const newCoins = Math.floor(score / 100) - Math.floor((score - scoreMultiplier) / 100);
    if (newCoins > 0) {
        let coinMultiplier = playerUpgrades.magnet ? 2 : 1;
        if (player.activeSkin === 'golden' || player.activeSkin === 'rainbow') {
            coinMultiplier *= 1.25; // 25% bonus
        }
        coinsThisRun += newCoins * coinMultiplier;
    }

    // Progressive difficulty system
    const oldDifficulty = difficultyLevel;
    difficultyLevel = Math.floor(score / 250) + 1; // Difficulty increases every 250 points

    if (difficultyLevel > oldDifficulty) {
        setTimeout(() => {
            showNotification(`🔥 DIFFICULTY LEVEL ${difficultyLevel}! 🔥\nThings are getting harder!`, '#f97316');
        }, 100);
    }

    if (gameMode === 'infinity') {
        // Progressive speed increase - starts very slow
        const speedIncrease = Math.min(difficultyLevel * 0.3, 8); // Max 8 extra speed
        speed = baseSpeed + speedIncrease;
    } else {
        // Level mode: check for level completion
        if (score >= levelTarget && currentLevel < levels.length) {
            // Level completed!
            currentLevel++;
            const newLevel = levels[currentLevel - 1];
            speed = newLevel.maxSpeed * (playerUpgrades.speed ? 0.4 : 0.3);
            baseSpeed = speed;
            levelTarget = newLevel.target;

            // Brief pause and notification
            setTimeout(() => {
                showNotification(`Level ${currentLevel - 1} Complete!\nEntering: ${newLevel.name}`, '#8b5cf6');
            }, 100);
        } else if (score >= levelTarget && currentLevel >= levels.length) {
            // Game completed!
            gameRunning = false;
            setTimeout(() => {
                coins += coinsThisRun;
                saveProgress();
                showNotification(`🎉 GAME COMPLETED! 🎉\nYou finished all levels!\nFinal Score: ${Math.floor(score)}\nCoins Earned: ${coinsThisRun} 🪙`, '#f59e0b');
                backToMenu();
            }, 100);
            return;
        }

        // Gradually increase speed within level
        const level = levels[currentLevel - 1];
        const levelProgress = (score - (currentLevel > 1 ? levels[currentLevel - 2].target : 0)) /
            (levelTarget - (currentLevel > 1 ? levels[currentLevel - 2].target : 0));
        speed = baseSpeed + (level.maxSpeed - baseSpeed) * levelProgress;
    }

    updateGameInfo();
    updateCoinDisplay();
} function getSpawnRate() {
    if (gameMode === 'infinity') {
        return 0.03;
    } else {
        return levels[currentLevel - 1].spawnRate;
    }
}

function drawBackground() {
    // Basis achtergrond gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#2C3E50');
    bgGradient.addColorStop(0.5, '#34495E');
    bgGradient.addColorStop(1, '#2C3E50');

    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tekenen van de drie railsporen
    for (let i = 0; i < 3; i++) {
        const laneCenter = lanes[i] + 20; // Center van elke lane

        // Rail lijnen
        ctx.strokeStyle = '#BDC3C7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(laneCenter - 15, 0);
        ctx.lineTo(laneCenter - 15, canvas.height);
        ctx.moveTo(laneCenter + 15, 0);
        ctx.lineTo(laneCenter + 15, canvas.height);
        ctx.stroke();

        // Dwarsliggers (railroad ties)
        ctx.fillStyle = '#8B4513';
        for (let y = -20; y < canvas.height + 20; y += 40) {
            const offsetY = (y + score * 2) % (canvas.height + 40) - 20;
            ctx.fillRect(laneCenter - 18, offsetY, 36, 6);
        }

        // Rail glans effect
        ctx.strokeStyle = 'rgba(236, 240, 241, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(laneCenter - 14, 0);
        ctx.lineTo(laneCenter - 14, canvas.height);
        ctx.moveTo(laneCenter + 14, 0);
        ctx.lineTo(laneCenter + 14, canvas.height);
        ctx.stroke();
    }

    // Tunnel muren
    ctx.fillStyle = '#1A252F';
    ctx.fillRect(0, 0, 100, canvas.height); // Links
    ctx.fillRect(380, 0, 100, canvas.height); // Rechts

    // Tunnel verlichting effect
    const lightGradient = ctx.createRadialGradient(240, 100, 0, 240, 100, 200);
    lightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawPlayer();
    drawObstacles();
    drawLevelInfo();
    updateObstacles();

    if (Math.random() < getDynamicSpawnRate()) {
        spawnObstacle();
    }

    updateGameLogic();

    if (checkCollision()) {
        if (temporaryShield && shieldTimeLeft > 0) {
            // Tijdelijk schild absorbeert hit
            temporaryShield = false;
            shieldTimeLeft = 0;
            // Remove colliding obstacle
            obstacles = obstacles.filter(obs => {
                return !(obs.x < player.x + player.w &&
                    obs.x + obs.w > player.x &&
                    obs.y < player.y + player.h &&
                    obs.y + obs.h > player.y);
            });
        } else if (player.lives > 1) {
            // Permanent shield absorbs hit
            player.lives--;
            // Remove colliding obstacle
            obstacles = obstacles.filter(obs => {
                return !(obs.x < player.x + player.w &&
                    obs.x + obs.w > player.x &&
                    obs.y < player.y + player.h &&
                    obs.y + obs.h > player.y);
            });
        } else {
            // Game over
            gameRunning = false;
            setTimeout(() => {
                coins += coinsThisRun;
                saveProgress();
                let message = `Game Over!\nScore: ${Math.floor(score)}\nCoins Earned: ${coinsThisRun} 🪙`;
                if (gameMode === 'level') {
                    message += `\nReached Level: ${currentLevel}`;
                }
                showNotification(message, '#10b981');
                backToMenu();
            }, 100);
            return;
        }
    }

    if (gameRunning) requestAnimationFrame(gameLoop);
}

function backToMenu() {
    startScreen.style.display = 'block';
    canvas.style.display = 'none';
    gameInfo.style.display = 'none';
}

document.addEventListener('keydown', e => {
    // Als het spel niet loopt en Enter wordt ingedrukt, start infinity mode
    if (!gameRunning && e.key === 'Enter') {
        startGame('infinity');
        return;
    }

    if (!gameRunning) return;

    if (e.key === 'ArrowLeft' && player.lane > 0) {
        player.lane--;
        // Instant snelle movement voor iedereen
        player.x = lanes[player.lane];
    }
    if (e.key === 'ArrowRight' && player.lane < 2) {
        player.lane++;
        // Instant snelle movement voor iedereen
        player.x = lanes[player.lane];
    }
});

function startGame(mode = 'infinity') {
    resetGame(mode);
    startScreen.style.display = 'none';
    canvas.style.display = 'block';
    gameInfo.style.display = 'block';
    gameRunning = true;
    requestAnimationFrame(gameLoop);
}

// Event listeners for gamemode buttons
infinityBtn.onclick = () => startGame('infinity');
levelBtn.onclick = () => startGame('level');

// Initialize coin display and shop
updateCoinDisplay();
updateShopDisplay();
