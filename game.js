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
let gameMode = 'infinity'; // 'infinity', 'level', or 'multiplayer'
let currentLevel = 1;
let levelProgress = 0;
let levelTarget = 1000; // Score needed to complete level

// Multiplayer state
let isMultiplayer = false;
let bots = [];
let playerRanking = [];
let multiplayerResults = null;

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
let speed = 7; // Veel snellere start snelheid
let score = 0;
let baseSpeed = 7;
let scoreMultiplier = 0.25; // Iets snellere score toename
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

// Bot system for multiplayer
class Bot {
    constructor(name, color, difficulty = 'medium') {
        this.name = name;
        this.x = 220;
        this.y = 540 + Math.random() * 100; // Slight y offset for visibility
        this.w = 35;
        this.h = 35;
        this.color = color;
        this.lane = 1;
        this.score = 0;
        this.alive = true;
        this.difficulty = difficulty; // 'easy', 'medium', 'hard'
        this.reactionTime = this.getDifficultyReactionTime();
        this.lastDecision = 0;
        this.targetLane = 1;
        this.isMoving = false;
    }

    getDifficultyReactionTime() {
        switch (this.difficulty) {
            case 'easy': return 800 + Math.random() * 400; // 800-1200ms
            case 'medium': return 400 + Math.random() * 300; // 400-700ms 
            case 'hard': return 150 + Math.random() * 200; // 150-350ms
            default: return 500;
        }
    }

    update() {
        if (!this.alive) return;

        // Update position if moving between lanes
        if (this.isMoving) {
            const targetX = lanes[this.targetLane];
            const diff = targetX - this.x;
            this.x += diff * 0.2;
            if (Math.abs(diff) < 2) {
                this.x = targetX;
                this.lane = this.targetLane;
                this.isMoving = false;
            }
        }

        // AI decision making
        const now = Date.now();
        if (now - this.lastDecision > this.reactionTime) {
            this.makeDecision();
            this.lastDecision = now;
            this.reactionTime = this.getDifficultyReactionTime(); // Vary reaction time
        }

        // Update score (slightly different rate per bot)
        this.score += scoreMultiplier * (0.9 + Math.random() * 0.2);
    }

    makeDecision() {
        if (this.isMoving) return;

        // Look ahead for obstacles
        const dangerAhead = this.checkDangerInLane(this.lane);
        const leftSafe = this.lane > 0 ? this.checkDangerInLane(this.lane - 1) : false;
        const rightSafe = this.lane < 2 ? this.checkDangerInLane(this.lane + 1) : false;

        if (dangerAhead) {
            // Try to move to safer lane
            if (leftSafe && !rightSafe) {
                this.moveTo(this.lane - 1);
            } else if (rightSafe && !leftSafe) {
                this.moveTo(this.lane + 1);
            } else if (leftSafe && rightSafe) {
                // Both safe, choose randomly
                const direction = Math.random() < 0.5 ? -1 : 1;
                this.moveTo(this.lane + direction);
            }
            // If no safe lane, stay put and hope for the best
        } else {
            // Randomly move sometimes to make bots more dynamic
            if (Math.random() < 0.1) { // 10% chance to move randomly
                const possibleMoves = [];
                if (this.lane > 0) possibleMoves.push(this.lane - 1);
                if (this.lane < 2) possibleMoves.push(this.lane + 1);
                if (possibleMoves.length > 0) {
                    const randomLane = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                    this.moveTo(randomLane);
                }
            }
        }
    }

    checkDangerInLane(lane) {
        const laneX = lanes[lane];
        return obstacles.some(obstacle => {
            const obstacleBottom = obstacle.y + obstacle.h;
            const obstacleTop = obstacle.y;
            const dangerZone = this.y - 150; // Look ahead distance

            return Math.abs(obstacle.x - laneX) < 30 &&
                obstacleBottom > dangerZone &&
                obstacleTop < this.y + this.h + 50;
        });
    }

    moveTo(newLane) {
        if (newLane >= 0 && newLane <= 2 && newLane !== this.lane) {
            this.targetLane = newLane;
            this.isMoving = true;
        }
    }

    checkCollision() {
        if (!this.alive) return false;

        return obstacles.some(obstacle => {
            return this.x < obstacle.x + obstacle.w &&
                this.x + this.w > obstacle.x &&
                this.y < obstacle.y + obstacle.h &&
                this.y + this.h > obstacle.y;
        });
    }

    draw() {
        if (!this.alive) return;

        // Bot body (slightly smaller than player)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 3, this.y + 3, this.w - 6, this.h - 6);

        // Bot outline
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 3, this.y + 3, this.w - 6, this.h - 6);

        // Bot "face" (simple eyes)
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 8, this.y + 8, 4, 4);
        ctx.fillRect(this.x + 18, this.y + 8, 4, 4);
    }
}

function initializeBots() {
    bots = [];
    const botConfigs = [
        { name: 'Bot Alpha', color: '#ff4444', difficulty: 'hard' },
        { name: 'Bot Beta', color: '#44ff44', difficulty: 'medium' },
        { name: 'Bot Gamma', color: '#4444ff', difficulty: 'medium' },
        { name: 'Bot Delta', color: '#ff44ff', difficulty: 'easy' }
    ];

    botConfigs.forEach((config, index) => {
        const bot = new Bot(config.name, config.color, config.difficulty);
        bot.y += (index - 1.5) * 15; // Spread bots vertically
        bots.push(bot);
    });
}

function updateMultiplayerRanking() {
    if (!isMultiplayer) return;

    const allPlayers = [
        { name: 'You', score: score, alive: player.lives > 0, isPlayer: true },
        ...bots.map(bot => ({ name: bot.name, score: bot.score, alive: bot.alive, isPlayer: false }))
    ];

    playerRanking = allPlayers.sort((a, b) => b.score - a.score);
}

function drawMultiplayerUI() {
    if (!isMultiplayer) return;

    // Draw ranking on the right side
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(canvas.width - 180, 10, 170, 200);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('🏆 Ranking', canvas.width - 170, 30);

    playerRanking.forEach((player, index) => {
        const y = 50 + index * 35;
        const color = player.alive ? (player.isPlayer ? '#ffff00' : '#ffffff') : '#666666';

        ctx.fillStyle = color;
        ctx.font = '14px Arial';

        const position = index + 1;
        const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;

        ctx.fillText(`${emoji} ${player.name}`, canvas.width - 170, y);
        ctx.fillText(`${Math.floor(player.score)}`, canvas.width - 170, y + 15);

        if (!player.alive) {
            ctx.fillStyle = '#ff4444';
            ctx.font = '12px Arial';
            ctx.fillText('💀 OUT', canvas.width - 60, y + 8);
        }
    });
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
    { id: 1, name: "Beginner Station", target: 1000, maxSpeed: 9, spawnRate: 0.02 },
    { id: 2, name: "City Junction", target: 2000, maxSpeed: 12, spawnRate: 0.025 },
    { id: 3, name: "Rush Hour", target: 3000, maxSpeed: 15, spawnRate: 0.03 },
    { id: 4, name: "Express Line", target: 4000, maxSpeed: 18, spawnRate: 0.035 },
    { id: 5, name: "Final Terminal", target: 5000, maxSpeed: 22, spawnRate: 0.04 }
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

    // Multiplayer setup
    isMultiplayer = (mode === 'multiplayer');
    if (isMultiplayer) {
        initializeBots();
        multiplayerResults = null;
    } else {
        bots = [];
        playerRanking = [];
    }

    // Reset shield system
    temporaryShield = false;
    shieldTimeLeft = 0;
    lastShieldScore = 0;

    // Snellere start
    if (gameMode === 'infinity') {
        speed = playerUpgrades.speed ? 8.5 : 7;
        baseSpeed = speed;
    } else {
        speed = levels[0].maxSpeed * (playerUpgrades.speed ? 0.8 : 0.7);
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
    } else if (gameMode === 'multiplayer') {
        modeDisplay.textContent = 'Mode: VS Bots (1v4)';
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

    // Update bots in multiplayer mode
    if (isMultiplayer) {
        bots.forEach(bot => {
            if (bot.alive) {
                bot.update();

                // Check bot collision
                if (bot.checkCollision()) {
                    bot.alive = false;
                    showNotification(`${bot.name} is uitgeschakeld! 💀`, '#ff4444');
                }
            }
        });

        updateMultiplayerRanking();

        // Check if player won/lost
        const aliveBots = bots.filter(bot => bot.alive).length;
        if (player.lives <= 0 || aliveBots === 0) {
            // Game over or player won
            setTimeout(() => {
                let message;
                if (player.lives <= 0) {
                    const playerPosition = playerRanking.findIndex(p => p.isPlayer) + 1;
                    message = `Game Over! Je eindigde op positie ${playerPosition}/5\nJe score: ${Math.floor(score)}`;
                } else {
                    message = `🎉 VICTORY! 🎉\nJe hebt alle bots verslagen!\nJe score: ${Math.floor(score)}`;
                }
                showNotification(message, '#f59e0b');
            }, 100);
        }
    }

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

    // Draw bots first (behind player)
    if (isMultiplayer) {
        bots.forEach(bot => bot.draw());
    }

    drawPlayer();
    drawObstacles();
    drawLevelInfo();

    // Draw multiplayer UI
    if (isMultiplayer) {
        drawMultiplayerUI();
    }

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

    // Draw notifications
    drawNotifications();

    if (gameRunning) requestAnimationFrame(gameLoop);
}

function backToMenu() {
    startScreen.style.display = 'block';
    canvas.style.display = 'none';
    gameInfo.style.display = 'none';

    // Restore body flex layout for menu
    document.body.style.display = 'flex';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
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

    // Center the game canvas
    document.body.style.display = 'block';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';

    gameRunning = true;
    requestAnimationFrame(gameLoop);
}

// Event listeners for gamemode buttons
infinityBtn.onclick = () => startGame('infinity');
levelBtn.onclick = () => startGame('level');
document.getElementById('multiplayer-btn').onclick = () => startGame('multiplayer');

// Enhanced UI Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Update log functionality
    const showUpdatesBtn = document.getElementById('show-updates');
    const updateLog = document.getElementById('update-log');
    const closeUpdatesBtn = document.getElementById('close-updates');

    showUpdatesBtn.onclick = () => {
        updateLog.classList.add('active');
    };

    closeUpdatesBtn.onclick = () => {
        updateLog.classList.remove('active');
    };

    // Shop tabs functionality
    const shopTabs = document.querySelectorAll('.shop-tab');
    const shopTabContents = document.querySelectorAll('.shop-tab-content');

    shopTabs.forEach(tab => {
        tab.onclick = () => {
            // Remove active from all tabs
            shopTabs.forEach(t => t.classList.remove('active'));
            shopTabContents.forEach(content => content.classList.remove('active'));

            // Add active to clicked tab
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.getElementById(`${tabName}-tab`).classList.add('active');
        };
    });

    // Ad system
    const watchAdBtn = document.getElementById('watch-ad-btn');
    const adModal = document.getElementById('ad-modal');
    const adCloseBtn = document.getElementById('ad-close-btn');
    const adClaimBtn = document.getElementById('ad-claim-btn');
    const adCountdown = document.getElementById('ad-countdown');
    let adTimer = null;

    watchAdBtn.onclick = () => {
        adModal.style.display = 'flex';
        startAdTimer();
    };

    adCloseBtn.onclick = () => {
        adModal.style.display = 'none';
        if (adTimer) clearInterval(adTimer);
    };

    adClaimBtn.onclick = () => {
        coins += 10;
        coinsThisRun += 10;
        saveProgress();
        updateCoinDisplay();
        showNotification('🎉 +10 Coins verdiend! 🎉', '#4ade80');
        adModal.style.display = 'none';

        // Cooldown van 30 seconden
        watchAdBtn.disabled = true;
        watchAdBtn.textContent = 'Wacht...';
        setTimeout(() => {
            watchAdBtn.disabled = false;
            watchAdBtn.textContent = 'Bekijk Ad';
        }, 30000);
    };

    function startAdTimer() {
        let countdown = 5;
        adCountdown.textContent = countdown;
        adClaimBtn.disabled = true;

        adTimer = setInterval(() => {
            countdown--;
            adCountdown.textContent = countdown;

            if (countdown <= 0) {
                clearInterval(adTimer);
                adClaimBtn.disabled = false;
                adClaimBtn.textContent = 'Claim 10 Coins! 🎉';
            }
        }, 1000);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) {
            if (e.key === 'l' || e.key === 'L') {
                startGame('level');
            } else if (e.key === 'm' || e.key === 'M') {
                startGame('multiplayer');
            }
        }
    });

    // Update active outfit display
    function updateActiveOutfitDisplay() {
        const activeOutfitSpan = document.getElementById('active-outfit');
        const skinNames = {
            'default': 'Default',
            'golden': 'Golden',
            'speed': 'Speed',
            'ghost': 'Ghost',
            'tank': 'Tank',
            'rainbow': 'Rainbow',
            'neon': 'Neon'
        };
        activeOutfitSpan.textContent = skinNames[player.activeSkin] || 'Default';
    }

    // Stats tracking
    let gameStats = JSON.parse(localStorage.getItem('subwayStats') || '{}');
    if (!gameStats.infinityBest) gameStats.infinityBest = 0;
    if (!gameStats.levelProgress) gameStats.levelProgress = 1;
    if (!gameStats.multiplayerWins) gameStats.multiplayerWins = 0;

    function updateStatsDisplay() {
        document.getElementById('infinity-best').textContent = Math.floor(gameStats.infinityBest);
        document.getElementById('level-progress').textContent = gameStats.levelProgress;
        document.getElementById('multiplayer-wins').textContent = gameStats.multiplayerWins;
    }

    function updateStats(mode, score, won = false) {
        if (mode === 'infinity' && score > gameStats.infinityBest) {
            gameStats.infinityBest = score;
        } else if (mode === 'level' && currentLevel > gameStats.levelProgress) {
            gameStats.levelProgress = currentLevel;
        } else if (mode === 'multiplayer' && won) {
            gameStats.multiplayerWins++;
        }
        localStorage.setItem('subwayStats', JSON.stringify(gameStats));
        updateStatsDisplay();
    }

    // Extend the existing resetGame to update outfit display
    const originalResetGame = resetGame;
    resetGame = function (mode = 'infinity') {
        originalResetGame(mode);
        updateActiveOutfitDisplay();
    };

    // Initialize displays
    updateStatsDisplay();
    updateActiveOutfitDisplay();
});

// Add new items to shop
const newShopItems = {
    ...shopItems,
    neonSkin: { price: 400, name: "Neon Racer" },
    doubleJump: { price: 75, name: "Double Jump" },
    timeSlower: { price: 120, name: "Time Slower" },
    coinRain: { price: 90, name: "Coin Rain" },
    megaShield: { price: 200, name: "Mega Shield" }
};

// Initialize coin display and shop
updateCoinDisplay();
updateShopDisplay();
