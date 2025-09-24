// ================================
// SUBWAY RUNNER GAME - IMPROVED VERSION
// ================================

console.log('🚀 Loading improved game engine...');

// ================================
// GLOBAL VARIABLES & CONFIGURATION
// ================================

// Core game state
let gameRunning = false;
let gameMode = 'infinity'; // 'infinity', 'level', 'multiplayer'
let currentLevel = 1;
let score = 0;
let coins = parseInt(localStorage.getItem('subwayCoins') || '0');
let coinsThisRun = 0;
let crystals = parseInt(localStorage.getItem('spaceCrystals') || '0');
let crystalsThisRun = 0;
let speed = 7;
let baseSpeed = 7;
let scoreMultiplier = 0.25;

// Animation frame management and performance
let animationFrameId = null;
let lastFrameTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

// Game elements
const canvas = document.getElementById('game-canvas');
if (!canvas) {
    console.error('❌ Canvas element not found! Make sure game-canvas exists in HTML.');
}
const ctx = canvas ? canvas.getContext('2d') : null;
if (!ctx) {
    console.error('❌ Could not get 2D context from canvas!');
}
const startScreen = document.getElementById('start-screen');
const gameInfo = document.getElementById('game-info');

// Player configuration
const player = {
    x: 220,
    y: 540,
    w: 40,
    h: 40,
    lane: 1,
    lives: 1,
    moveSpeed: 1,
    activeSkin: 'default',
    ghostCharges: 0
};

// Game world
const lanes = [120, 220, 320]; // Fixed lane positions
let obstacles = [];
let particles = [];
let collectiblePowerUps = [];
let activePowerUps = [];

// Multiplayer
let isMultiplayer = false;
let bots = [];
let playerRanking = [];

// Audio system
let isMuted = false;
let effectsVolume = 0.5;
let musicVolume = 0.3;

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// ================================
// CORE GAME FUNCTIONS
// ================================

/**
 * Main game start function - clean and reliable
 */
function startGame(mode = 'infinity') {
    console.log(`🎮 Starting game in ${mode} mode`);

    try {
        // Stop any existing game and cancel animation frames
        if (gameRunning) {
            gameRunning = false;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            console.log('🛑 Stopped previous game and cancelled animation frames');
        }

        // Validate canvas
        if (!canvas || !ctx) {
            console.error('❌ Canvas not available');
            return false;
        }

        // Reset and start
        resetGame(mode);
        showGameScreen();
        gameRunning = true;

        console.log('✅ Game started successfully');
        animationFrameId = requestAnimationFrame(gameLoop);

        return true;
    } catch (error) {
        console.error('❌ Failed to start game:', error);
        return false;
    }
}

/**
 * Reset game state for new game
 */
function resetGame(mode = 'infinity') {
    console.log(`🔄 Resetting game for ${mode} mode`);

    // Validate lanes array
    if (!Array.isArray(lanes) || lanes.length !== 3) {
        console.error('❌ Lanes array corrupted, fixing...');
        lanes.splice(0, lanes.length, 120, 220, 320);
    }

    // Reset game state
    gameMode = mode;
    score = 0;
    coinsThisRun = 0;
    crystalsThisRun = 0;
    speed = baseSpeed;
    currentLevel = 1;

    // Reset player
    player.lane = 1;
    player.x = lanes[player.lane];
    player.y = 540;
    player.lives = 1;
    player.ghostCharges = 0;

    // Clear arrays
    obstacles.length = 0;
    particles.length = 0;
    collectiblePowerUps.length = 0;
    activePowerUps.length = 0;

    // Setup multiplayer if needed
    isMultiplayer = (mode === 'multiplayer');
    if (isMultiplayer) {
        initializeBots();
    } else {
        bots.length = 0;
        playerRanking.length = 0;
    }

    // Setup special game mode configurations
    setupGameMode(mode);

    console.log(`✅ Game reset complete - Player at x:${player.x}, lane:${player.lane}`);
}

/**
 * Show game screen and hide menu
 */
function showGameScreen() {
    if (startScreen) startScreen.style.display = 'none';
    if (canvas) canvas.style.display = 'block';
    if (gameInfo) gameInfo.style.display = 'block';

    // Add game-mode class for proper styling
    document.body.classList.add('game-mode');

    // Adjust canvas for fullscreen gaming
    adjustCanvasForGameMode();

    // Show mobile controls if on mobile
    if (isMobile) {
        showMobileControls();
        adjustCanvasForMobile();
    }
}

/**
 * Return to main menu
 */
function backToMenu() {
    gameRunning = false;

    // Stop animation frames
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        console.log('🔄 Animation frames stopped - returning to menu');
    }

    if (startScreen) startScreen.style.display = 'block';
    if (canvas) canvas.style.display = 'none';
    if (gameInfo) gameInfo.style.display = 'none';

    // Remove game-mode class to restore normal styling
    document.body.classList.remove('game-mode');

    // Hide mobile controls
    if (isMobile) {
        hideMobileControls();
    }
}

// ================================
// MOVEMENT SYSTEM - IMPROVED
// ================================

/**
 * Handle player movement - instant and reliable
 */
function movePlayer(direction) {
    if (!gameRunning) return false;

    const oldLane = player.lane;
    let newLane = player.lane;

    if (direction === 'left' && player.lane > 0) {
        newLane = player.lane - 1;
    } else if (direction === 'right' && player.lane < 2) {
        newLane = player.lane + 1;
    } else {
        return false; // Invalid move
    }

    // Execute movement
    player.lane = newLane;
    player.x = lanes[player.lane];

    // Visual effects
    playSound('jump');
    createParticle(player.x + player.w / 2, player.y + player.h / 2, 'speed', '#00BFFF', 3);

    console.log(`🎯 Player moved ${direction}: lane ${oldLane} → ${newLane}, x: ${player.x}`);
    return true;
}

// ================================
// BOT SYSTEM - IMPROVED
// ================================

class Bot {
    constructor(name, color, difficulty = 'medium') {
        this.name = name;
        this.color = color;
        this.difficulty = difficulty;

        // Position
        this.lane = 1;
        this.x = lanes[this.lane];
        this.y = 540 + Math.random() * 80; // Slight offset for visibility
        this.w = 35;
        this.h = 35;

        // AI state
        this.alive = true;
        this.score = 0;
        this.reactionTime = this.getReactionTime();
        this.lastDecision = 0;
        this.isMoving = false;
        this.targetLane = this.lane;
    }

    getReactionTime() {
        const times = {
            'easy': [300, 500],
            'medium': [150, 300],
            'hard': [50, 150]
        };
        const [min, max] = times[this.difficulty] || times.medium;
        return min + Math.random() * (max - min);
    }

    update() {
        if (!this.alive) return;

        // Handle movement
        if (this.isMoving) {
            const targetX = lanes[this.targetLane];
            const diff = targetX - this.x;

            if (Math.abs(diff) > 5) {
                this.x += diff * 0.6; // Smooth movement
            } else {
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
            this.reactionTime = this.getReactionTime();
        }

        // Update score
        this.score += scoreMultiplier * (0.95 + Math.random() * 0.1);
    }

    makeDecision() {
        if (this.isMoving) return;

        // Check for danger in current lane
        const dangerAhead = this.checkDanger(this.lane);

        if (dangerAhead) {
            // Try to find safe lane
            const safeLanes = [];
            if (this.lane > 0 && !this.checkDanger(this.lane - 1)) {
                safeLanes.push(this.lane - 1);
            }
            if (this.lane < 2 && !this.checkDanger(this.lane + 1)) {
                safeLanes.push(this.lane + 1);
            }

            if (safeLanes.length > 0) {
                const targetLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
                this.moveTo(targetLane);
            }
        } else if (Math.random() < 0.15) {
            // Random movement for variety
            const possibleMoves = [];
            if (this.lane > 0) possibleMoves.push(this.lane - 1);
            if (this.lane < 2) possibleMoves.push(this.lane + 1);

            if (possibleMoves.length > 0) {
                const randomLane = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                this.moveTo(randomLane);
            }
        }
    }

    checkDanger(lane) {
        const laneX = lanes[lane];
        const lookAhead = 200;

        return obstacles.some(obstacle => {
            return Math.abs(obstacle.x - laneX) < 30 &&
                obstacle.y > this.y - lookAhead &&
                obstacle.y < this.y + this.h + 50;
        });
    }

    moveTo(newLane) {
        if (newLane >= 0 && newLane <= 2 && newLane !== this.lane && !this.isMoving) {
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

        // Bot body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 3, this.y + 3, this.w - 6, this.h - 6);

        // Outline
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 3, this.y + 3, this.w - 6, this.h - 6);

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 8, this.y + 8, 4, 4);
        ctx.fillRect(this.x + 18, this.y + 8, 4, 4);
    }
}

function initializeBots() {
    console.log('🤖 Initializing bots for multiplayer...');

    bots.length = 0; // Clear existing bots

    const botConfigs = [
        { name: 'Alpha', color: '#ff4444', difficulty: 'hard' },
        { name: 'Beta', color: '#44ff44', difficulty: 'medium' },
        { name: 'Gamma', color: '#4444ff', difficulty: 'medium' },
        { name: 'Delta', color: '#ff44ff', difficulty: 'easy' }
    ];

    botConfigs.forEach((config, index) => {
        const bot = new Bot(config.name, config.color, config.difficulty);
        bot.y += (index - 1.5) * 12; // Spread vertically
        bots.push(bot);
    });

    console.log(`✅ Created ${bots.length} bots`);
}

// ================================
// DRAWING FUNCTIONS
// ================================

function drawBackground() {
    // Clear canvas - light background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw lanes
    for (let i = 0; i < 3; i++) {
        const laneCenter = lanes[i] + 20;

        // Lane lines
        ctx.strokeStyle = '#bbb';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(laneCenter - 15, 0);
        ctx.lineTo(laneCenter - 15, canvas.height);
        ctx.moveTo(laneCenter + 15, 0);
        ctx.lineTo(laneCenter + 15, canvas.height);
        ctx.stroke();

        // Railway ties
        ctx.fillStyle = '#4ecdc4';
        for (let y = -20; y < canvas.height + 20; y += 40) {
            const tieY = (y + Date.now() * 0.1) % (canvas.height + 40) - 20;
            ctx.fillRect(laneCenter - 18, tieY, 36, 8);
        }
    }

    // Note: Tunnel walls removed for cleaner gameplay
}

function drawPlayer() {
    const { x, y, w, h } = player;

    // Shadow - removed for cleaner display

    // Player body with gradient
    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.3, '#FFC107');
    gradient.addColorStop(0.7, '#FF9800');
    gradient.addColorStop(1, '#F57C00');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(x + 2, y + 2, w - 4, 8);

    // Border
    ctx.strokeStyle = '#E65100';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 8, y + 10, 4, 4);
    ctx.fillRect(x + 28, y + 10, 4, 4);
}

function drawObstacles() {
    obstacles.forEach(obs => {
        const { x, y, w, h } = obs;

        // Shadow - removed for cleaner display

        // Obstacle body with gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, '#F44336');
        gradient.addColorStop(0.5, '#D32F2F');
        gradient.addColorStop(1, '#B71C1C');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, h);

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x + 2, y + 2, w - 4, 6);

        // Border
        ctx.strokeStyle = '#8E0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Warning pattern
        ctx.fillStyle = '#FFEB3B';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + 5 + i * 10, y + 5, 3, 3);
            ctx.fillRect(x + 5 + i * 10, y + h - 8, 3, 3);
        }
    });
}

function drawUI() {
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 30);

    // Mode-specific Best Score
    const modeBest = getModeSpecificBest();
    ctx.font = '16px Arial';
    ctx.fillStyle = '#FFD700';

    // Display appropriate label and value based on game mode
    if (gameMode === 'speedrun' || gameMode === 'coinrush') {
        if (modeBest > 0) {
            ctx.fillText(`🏆 Best Time: ${modeBest.toFixed(2)}s`, 10, 55);
        } else {
            ctx.fillText(`🏆 Best Time: --`, 10, 55);
        }
    } else if (gameMode === 'survival') {
        if (modeBest > 0) {
            ctx.fillText(`🏆 Best Survival: ${modeBest.toFixed(2)}s`, 10, 55);
        } else {
            ctx.fillText(`🏆 Best Survival: --`, 10, 55);
        }
    } else {
        // Score-based modes
        ctx.fillText(`� BEST SCORE: ${Math.floor(modeBest)}`, 10, 55);
    }

    // Reset shadow
    ctx.shadowBlur = 0;

    // Mode specific info
    drawModeSpecificUI();

    // Mode info (bottom) - TEST
    ctx.font = '14px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText(`Mode: ${gameMode} | Score: ${Math.floor(score)}`, 10, canvas.height - 40);

    if (gameMode === 'level') {
        ctx.fillText(`Level: ${currentLevel}`, 10, canvas.height - 20);
    }

    // Multiplayer ranking
    if (isMultiplayer) {
        drawMultiplayerUI();
    }
}

function drawModeSpecificUI() {
    ctx.font = '14px Arial';
    ctx.fillStyle = '#4CAF50';

    switch (gameMode) {
        case 'chaos':
            if (currentChaosEffect) {
                ctx.fillText(`🌪️ Effect: ${currentChaosEffect}`, 10, 85);
            }
            const nextChaos = Math.ceil((300 - chaosTimer) / 60);
            ctx.fillText(`Next chaos in: ${nextChaos}s`, 10, 105);
            break;

        case 'speedrun':
            const speedrunTime = ((Date.now() - speedrunStartTime) / 1000).toFixed(1);
            ctx.fillText(`⚡ Time: ${speedrunTime}s`, 10, 85);
            ctx.fillText(`🎯 Target: 1000 points`, 10, 105);
            break;

        case 'survival':
            const survivalTime = ((Date.now() - survivalStartTime) / 1000).toFixed(1);
            ctx.fillText(`🛡️ Survived: ${survivalTime}s`, 10, 85);
            ctx.fillText(`❤️ Lives: ${player.lives}`, 10, 105);
            break;

        case 'coinrush':
            const coinrushTime = ((Date.now() - coinrushStartTime) / 1000).toFixed(1);
            ctx.fillText(`💰 Time: ${coinrushTime}s`, 10, 85);
            ctx.fillText(`🎯 Target: 100 coins (${coinsThisRun}/100)`, 10, 105);
            break;

        case 'nightmare':
            ctx.fillStyle = '#FF6B6B';
            ctx.fillText(`😈 NIGHTMARE MODE`, 10, 85);
            ctx.fillText(`💀 Lives: ${player.lives}`, 10, 105);
            break;
    }
}

function drawMultiplayerUI() {
    // Update ranking
    const allPlayers = [
        { name: 'You', score: score, alive: player.lives > 0, isPlayer: true },
        ...bots.map(bot => ({ name: bot.name, score: bot.score, alive: bot.alive, isPlayer: false }))
    ];
    playerRanking = allPlayers.sort((a, b) => b.score - a.score);

    // Draw ranking panel - lighter background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(canvas.width - 180, 10, 170, 200);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('🏆 Ranking', canvas.width - 170, 30);

    playerRanking.forEach((p, index) => {
        const y = 50 + index * 35;
        const color = p.alive ? (p.isPlayer ? '#ffff00' : '#ffffff') : '#666666';

        ctx.fillStyle = color;
        ctx.font = '14px Arial';

        const position = index + 1;
        const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;

        ctx.fillText(`${emoji} ${p.name}`, canvas.width - 170, y);
        ctx.fillText(`${Math.floor(p.score)}`, canvas.width - 170, y + 15);

        if (!p.alive) {
            ctx.fillStyle = '#ff4444';
            ctx.font = '12px Arial';
            ctx.fillText('💀 OUT', canvas.width - 60, y + 8);
        }
    });
}

// ================================
// GAME LOGIC
// ================================

function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    obstacles.push({
        x: lanes[lane],
        y: -60,
        w: 40,
        h: 40
    });
}

function updateObstacles() {
    // Move obstacles down
    obstacles.forEach(obs => {
        obs.y += speed;
    });

    // Remove off-screen obstacles
    obstacles = obstacles.filter(obs => obs.y < canvas.height);
}

function checkCollision() {
    return obstacles.some(obs => {
        return player.x < obs.x + obs.w &&
            player.x + player.w > obs.x &&
            player.y < obs.y + obs.h &&
            player.y + player.h > obs.y;
    });
}

function updateGameLogic() {
    // Update score
    score += scoreMultiplier;

    // Update crystals - space theme
    const newCrystals = Math.floor(score / 80) - Math.floor((score - scoreMultiplier) / 80);
    if (newCrystals > 0) {
        crystalsThisRun += newCrystals;
        crystals += newCrystals;

        console.log(`💎 Earned ${newCrystals} crystals! Total: ${crystals}`);

        // Immediate save voor crystals
        try {
            localStorage.setItem('spaceCrystals', crystals.toString());
            localStorage.setItem('bestScore', Math.max(parseInt(localStorage.getItem('bestScore') || '0'), Math.floor(score)).toString());
            console.log(`💾 Crystals saved: ${crystals}`);
        } catch (error) {
            console.error('❌ Failed to save crystals:', error);
        }

        // Update display - crystal counter updated automatically via localStorage

        // Visual feedback - crystal particle effect
        createParticle(player.x + player.w / 2, player.y, 'crystal', '#ff00ff', 3);
        playSound('crystal');
    }

    // Update speed (progressive difficulty)
    const speedIncrease = Math.min(Math.floor(score / 250) * 0.3, 8);
    speed = baseSpeed + speedIncrease;

    // Special game mode updates
    updateGameModeLogic();

    // Update bots in multiplayer
    if (isMultiplayer) {
        bots.forEach(bot => {
            if (bot.alive) {
                bot.update();
                if (bot.checkCollision()) {
                    bot.alive = false;
                    console.log(`💀 ${bot.name} eliminated!`);
                }
            }
        });

        // Check win/lose conditions
        const aliveBots = bots.filter(bot => bot.alive).length;
        if (player.lives <= 0 || aliveBots === 0) {
            endGame();
        }
    }

    // Check for game mode specific win conditions
    checkGameModeWinConditions();

    // Spawn obstacles
    const spawnRate = Math.min(0.005 + (score / 10000), 0.04);
    if (Math.random() < spawnRate) {
        spawnObstacle();
    }
}

function endGame() {
    gameRunning = false;

    // Stop animation frames immediately
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        console.log('🛑 Animation frames cancelled');
    }

    // Debug info voor score opslaan
    console.log(`🎯 Final Score: ${Math.floor(score)}`);
    console.log(`🏆 Current Best Score: ${localStorage.getItem('bestScore')}`);
    console.log(`💰 Final coins earned this run: ${coinsThisRun}`);
    console.log(`🏦 Total coins before save: ${coins}`);

    // EXTRA BACKUP SAVE - Direct localStorage save
    try {
        localStorage.setItem('subwayCoins', coins.toString());
        const newBestScore = Math.max(parseInt(localStorage.getItem('bestScore') || '0'), Math.floor(score));
        localStorage.setItem('bestScore', newBestScore.toString());
        console.log(`🔒 Backup save completed: ${coins} coins, best score: ${newBestScore}`);
    } catch (error) {
        console.error('❌ Backup save failed:', error);
    }

    // Save mode-specific best score
    const modeBest = saveModeSpecificBest();

    const saveSuccess = saveGameProgress();

    if (saveSuccess) {
        console.log(`✅ Progress saved successfully! New total: ${coins} coins`);
    } else {
        console.error('❌ Failed to save progress!');
    }

    let message = `Game Over!\nFinal Score: ${Math.floor(score)}\nCoins Earned: +${coinsThisRun}\nTotal Coins: ${coins}`;

    if (isMultiplayer) {
        const playerPosition = playerRanking.findIndex(p => p.isPlayer) + 1;
        if (player.lives > 0) {
            message = `🎉 VICTORY! 🎉\nYou won!\nFinal Score: ${Math.floor(score)}\nCoins Earned: +${coinsThisRun}\nTotal Coins: ${coins}`;
        } else {
            message = `Game Over!\nPosition: ${playerPosition}/${playerRanking.length}\nFinal Score: ${Math.floor(score)}\nCoins Earned: +${coinsThisRun}\nTotal Coins: ${coins}`;
        }
    }

    console.log(message);

    // Update coin display in UI
    updateCoinDisplay();

    setTimeout(() => {
        backToMenu();
    }, 3000);
}

/**
 * Update coin display in UI
 */
function updateCoinDisplay() {
    const coinDisplayElements = document.querySelectorAll('#coin-display, [data-coins]');
    coinDisplayElements.forEach(element => {
        if (element) {
            element.textContent = coins;
        }
    });

    // Update shop button states based on current coin amount (only if shop is open)
    const shopPanel = document.getElementById('shop-panel');
    if (shopPanel && shopPanel.style.display === 'block') {
        const buyButtons = document.querySelectorAll('.buy-btn');
        buyButtons.forEach(button => {
            const itemId = button.getAttribute('data-item');
            if (itemId && shopItems[itemId]) {
                updateButtonState(itemId, button);
            }
        });
    }

    // Update mode-specific best scores in menu
    updateModeSpecificDisplays();

    console.log(`💰 UI updated - Current coins: ${coins}`);
}

/**
 * Update mode-specific best score displays in the main menu
 */
function updateModeSpecificDisplays() {
    try {
        // Update each game mode's best score display
        const modes = ['chaos', 'speedrun', 'survival', 'coinrush', 'nightmare'];

        modes.forEach(mode => {
            const bestValue = getModeSpecificBest(mode);
            const element = document.getElementById(`${mode}-best`);

            if (element) {
                if (mode === 'speedrun' || mode === 'coinrush') {
                    // Time-based modes
                    element.textContent = bestValue > 0 ? `${bestValue.toFixed(2)}s` : '∞';
                } else if (mode === 'survival') {
                    // Survival time
                    element.textContent = bestValue > 0 ? `${bestValue.toFixed(2)}s` : '0s';
                } else {
                    // Score-based modes
                    element.textContent = Math.floor(bestValue) || '0';
                }
            }
        });

        // Update general best score
        const generalBest = parseInt(localStorage.getItem('bestScore') || '0');
        const generalBestElement = document.getElementById('best-score');
        if (generalBestElement) {
            generalBestElement.textContent = generalBest;
        }

    } catch (error) {
        console.error('❌ Failed to update mode-specific displays:', error);
    }
}

// ================================
// PARTICLES & EFFECTS
// ================================

class Particle {
    constructor(x, y, type = 'default', color = '#FFD700') {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.life = 1.0;
        this.decay = 0.02;
        this.size = Math.random() * 4 + 2;
        this.color = color;
        this.type = type;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // Gravity
        this.life -= this.decay;
        return this.life > 0;
    }

    draw() {
        if (this.life <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function createParticle(x, y, type = 'default', color = '#FFD700', count = 1) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, type, color));
    }
}

function updateParticles() {
    particles = particles.filter(particle => {
        const alive = particle.update();
        if (alive) particle.draw();
        return alive;
    });
}

// ================================
// SAVE SYSTEM - IMPROVED
// ================================

/**
 * Save all game progress to localStorage
 */
function saveGameProgress() {
    try {
        // Debug info
        console.log(`💾 Saving progress: Score=${Math.floor(score)}, Coins=${coins}, CoinsThisRun=${coinsThisRun}`);

        // Save coins
        localStorage.setItem('subwayCoins', coins.toString());

        // Save stats
        const currentBestScore = parseInt(localStorage.getItem('bestScore') || '0');
        const newBestScore = Math.max(currentBestScore, Math.floor(score));

        const stats = {
            totalCoins: coins,
            totalGamesPlayed: (parseInt(localStorage.getItem('totalGamesPlayed') || '0')) + 1,
            bestScore: newBestScore,
            lastScore: Math.floor(score),
            lastCoinsEarned: coinsThisRun,
            lastPlayTime: Date.now()
        };

        localStorage.setItem('gameStats', JSON.stringify(stats));
        localStorage.setItem('bestScore', stats.bestScore.toString());
        localStorage.setItem('totalGamesPlayed', stats.totalGamesPlayed.toString());

        console.log('💾 Game progress saved:', stats);
        console.log(`🏆 Best score updated: ${currentBestScore} → ${newBestScore}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to save progress:', error);
        return false;
    }
}

/**
 * Load game progress from localStorage
 */
function loadGameProgress() {
    try {
        coins = parseInt(localStorage.getItem('subwayCoins') || '0');
        const stats = JSON.parse(localStorage.getItem('gameStats') || '{}');
        console.log('📥 Game progress loaded:', { coins, stats });
        return true;
    } catch (error) {
        console.error('❌ Failed to load progress:', error);
        coins = 0;
        return false;
    }
}

/**
 * Save best score for specific game mode
 */
function saveModeSpecificBest() {
    try {
        const modeKey = `best_${gameMode}`;
        const currentModeBest = parseInt(localStorage.getItem(modeKey) || '0');
        let newBest = currentModeBest;

        // For time-based modes, save time; for score-based modes, save score
        if (gameMode === 'speedrun') {
            const currentTime = (Date.now() - speedrunStartTime) / 1000;
            if (score >= 1000) { // Only save if target reached
                if (currentModeBest === 0 || currentTime < currentModeBest) {
                    newBest = currentTime;
                    localStorage.setItem(modeKey, newBest.toString());
                    console.log(`🏆 New ${gameMode} best: ${newBest.toFixed(2)}s`);
                }
            }
        } else if (gameMode === 'coinrush') {
            const currentTime = (Date.now() - coinrushStartTime) / 1000;
            if (coinsThisRun >= 100) { // Only save if target reached
                if (currentModeBest === 0 || currentTime < currentModeBest) {
                    newBest = currentTime;
                    localStorage.setItem(modeKey, newBest.toString());
                    console.log(`🏆 New ${gameMode} best: ${newBest.toFixed(2)}s`);
                }
            }
        } else if (gameMode === 'survival') {
            const currentTime = (Date.now() - survivalStartTime) / 1000;
            if (currentTime > currentModeBest) {
                newBest = currentTime;
                localStorage.setItem(modeKey, newBest.toString());
                console.log(`🏆 New ${gameMode} best: ${newBest.toFixed(2)}s`);
            }
        } else {
            // Score-based modes (chaos, nightmare, infinity, level, multiplayer)
            const currentScore = Math.floor(score);
            if (currentScore > currentModeBest) {
                newBest = currentScore;
                localStorage.setItem(modeKey, newBest.toString());
                console.log(`🏆 New ${gameMode} best: ${newBest} points`);
            }
        }

        return newBest;
    } catch (error) {
        console.error('❌ Failed to save mode-specific best:', error);
        return 0;
    }
}

/**
 * Get best score for specific game mode
 */
function getModeSpecificBest(mode = gameMode) {
    try {
        const modeKey = `best_${mode}`;
        return parseFloat(localStorage.getItem(modeKey) || '0');
    } catch (error) {
        console.error('❌ Failed to get mode-specific best:', error);
        return 0;
    }
}

function playSound(soundName, volume = effectsVolume) {
    if (isMuted) return;

    try {
        // Create simple beep sounds
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(volume * 0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);

        const frequencies = {
            'jump': 600,
            'coin': 800,
            'crash': 200,
            'powerup': 1000
        };

        oscillator.frequency.setValueAtTime(frequencies[soundName] || 440, audioContext.currentTime);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        // Audio not available
    }
}

// ================================
// INPUT HANDLING
// ================================

document.addEventListener('keydown', (e) => {
    console.log(`🎮 Key pressed: ${e.key}, Game running: ${gameRunning}`);

    // Start game shortcuts
    if (!gameRunning) {
        if (e.key === 'Enter') startGame('infinity');
        if (e.key.toLowerCase() === 'l') startGame('level');
        if (e.key.toLowerCase() === 'm') startGame('multiplayer');
        return;
    }

    // Movement controls
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        movePlayer('left');
    } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        movePlayer('right');
    } else if (e.key === 'Escape') {
        backToMenu();
    }
});

// ================================
// MOBILE CONTROLS
// ================================

let touchStartX = 0;
let touchStartY = 0;

function initMobileControls() {
    if (!isMobile || !canvas) return;

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (!gameRunning) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        // Swipe detection
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                movePlayer('right');
            } else {
                movePlayer('left');
            }
        }
    });
}

function adjustCanvasForMobile() {
    if (!isMobile || !canvas) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const maxWidth = Math.min(screenWidth * 0.9, 480);
    const maxHeight = Math.min(screenHeight * 0.7, 640);

    canvas.style.width = maxWidth + 'px';
    canvas.style.height = maxHeight + 'px';
}

function showMobileControls() {
    // Implementation for mobile UI controls
}

function hideMobileControls() {
    // Implementation for hiding mobile UI controls
}

// ================================
// MAIN GAME LOOP
// ================================

function gameLoop(currentTime = 0) {
    if (!gameRunning || !ctx) return;

    // FPS limiting - skip frame if too soon
    if (currentTime - lastFrameTime < frameInterval) {
        if (gameRunning) {
            animationFrameId = requestAnimationFrame(gameLoop);
        }
        return;
    }
    lastFrameTime = currentTime;

    // Clear and draw background
    drawBackground();

    // Draw bots (behind player)
    if (isMultiplayer) {
        bots.forEach(bot => bot.draw());
    }

    // Draw game objects
    drawPlayer();
    drawObstacles();
    drawUI();

    // Update game state
    updateObstacles();
    updateGameLogic();
    updateParticles();

    // Check collisions
    if (checkCollision()) {
        player.lives--;

        // Save coins immediately bij collision
        try {
            localStorage.setItem('subwayCoins', coins.toString());
            console.log(`💥 Collision! Coins saved: ${coins}`);
        } catch (error) {
            console.error('Failed to save coins on collision:', error);
        }

        if (player.lives <= 0) {
            // Final save before game end
            console.log(`💀 Game over! Final save - Total coins: ${coins}, This run: ${coinsThisRun}`);
            endGame();
            return;
        }
    }

    // Continue loop with frame tracking
    if (gameRunning) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// ================================
// INITIALIZATION
// ================================

// Make startGame globally available
window.startGame = startGame;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Loading improved game engine...');

    // Load saved progress FIRST
    loadGameProgress();

    // Update all displays with loaded data
    updateCoinDisplay();

    // Initialize mobile controls
    if (isMobile) {
        initMobileControls();
    }

    // Setup button event listeners
    const buttons = {
        'infinity-btn': () => startGame('infinity'),
        'level-btn': () => startGame('level'),
        'multiplayer-btn': () => startGame('multiplayer'),
        'chaos-btn': () => startGame('chaos'),
        'speedrun-btn': () => startGame('speedrun'),
        'survival-btn': () => startGame('survival'),
        'coinrush-btn': () => startGame('coinrush'),
        'nightmare-btn': () => startGame('nightmare')
    };

    Object.entries(buttons).forEach(([id, handler]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.onclick = handler;
            console.log(`✅ Button ${id} connected`);
        } else {
            console.warn(`❌ Button ${id} not found`);
        }
    });

    // Setup all UI interface buttons
    setupUIButtons();

    // Update coin display immediately
    updateCoinDisplay();

    // Debug localStorage contents
    console.log('� LocalStorage contents:');
    console.log('- subwayCoins:', localStorage.getItem('subwayCoins'));
    console.log('- bestScore:', localStorage.getItem('bestScore'));
    console.log('- gameStats:', localStorage.getItem('gameStats'));

    console.log(`🎮 Game engine initialized! Starting coins: ${coins}`);

    // Initialize shop functionality
    initializeShop();
});

// ================================
// UI BUTTON SETUP
// ================================

function setupUIButtons() {
    console.log('🔧 Setting up UI buttons...');

    // Debug: Check which buttons exist in DOM
    const buttonIds = ['shop-panel', 'close-shop', 'settings-modal', 'settings-btn', 'settings-close',
        'update-log', 'show-updates', 'close-updates', 'gtstijn-btn', 'echobots-btn'];

    buttonIds.forEach(id => {
        const element = document.getElementById(id);
        console.log(`🔍 ${id}: ${element ? '✅ Found' : '❌ Not found'}`);
    });

    // Shop Panel
    const shopPanel = document.getElementById('shop-panel');
    const closeShopBtn = document.getElementById('close-shop');

    // Settings Modal
    const settingsModal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsCloseBtn = document.getElementById('settings-close');

    // Updates Panel
    const updateLog = document.getElementById('update-log');
    const showUpdatesBtn = document.getElementById('show-updates');
    const closeUpdatesBtn = document.getElementById('close-updates');

    // Website redirect buttons
    const gtstijnBtn = document.getElementById('gtstijn-btn');
    const echobotsBtn = document.getElementById('echobots-btn');

    // Add shop button to header if not exists
    const gameHeader = document.querySelector('.game-header');
    if (gameHeader && !document.getElementById('shop-btn')) {
        const shopBtn = document.createElement('button');
        shopBtn.id = 'shop-btn';
        shopBtn.className = 'settings-btn';
        shopBtn.innerHTML = '🛒 Shop';
        shopBtn.onclick = () => {
            console.log('🛒 Opening shop...');
            if (shopPanel) {
                shopPanel.style.display = 'block';
                shopPanel.classList.add('show');
                // Initialize shop buttons when shop opens
                initializeShopButtons();
            }
        };
        gameHeader.appendChild(shopBtn);
        console.log('✅ Shop button created and added');
    }

    // Shop functionality
    if (closeShopBtn && shopPanel) {
        closeShopBtn.onclick = () => {
            console.log('❌ Closing shop...');
            shopPanel.style.display = 'none';
            shopPanel.classList.remove('show');
        };
        console.log('✅ Shop close button connected');
    } else {
        console.warn('❌ Shop close button or panel not found');
    }

    // Settings functionality
    if (settingsBtn && settingsModal) {
        settingsBtn.onclick = () => {
            console.log('⚙️ Opening settings...');
            settingsModal.style.display = 'block';
        };
        console.log('✅ Settings button connected');
    } else {
        console.warn('❌ Settings button or modal not found');
    }

    if (settingsCloseBtn && settingsModal) {
        settingsCloseBtn.onclick = () => {
            console.log('❌ Closing settings...');
            settingsModal.style.display = 'none';
        };
        console.log('✅ Settings close button connected');
    } else {
        console.warn('❌ Settings close button or modal not found');
    }

    // Updates functionality
    if (showUpdatesBtn && updateLog) {
        showUpdatesBtn.onclick = () => {
            console.log('📋 Opening updates...');
            updateLog.style.display = 'block';
        };
        console.log('✅ Updates button connected');
    }

    if (closeUpdatesBtn && updateLog) {
        closeUpdatesBtn.onclick = () => {
            console.log('❌ Closing updates...');
            updateLog.style.display = 'none';
        };
        console.log('✅ Updates close button connected');
    }

    // GTStijn.site redirect
    if (gtstijnBtn) {
        gtstijnBtn.onclick = () => {
            console.log('🌐 Redirecting to GTStijn.site...');
            window.open('https://gtstijn.site/', '_blank');
        };
        console.log('✅ GTStijn.site button connected');
    } else {
        console.warn('❌ GTStijn.site button not found');
    }

    // EchoBots.gg redirect
    if (echobotsBtn) {
        echobotsBtn.onclick = () => {
            console.log('🤖 Redirecting to EchoBots.gg...');
            window.open('https://echobots.gg/', '_blank');
        };
        console.log('✅ EchoBots.gg button connected');
    } else {
        console.warn('❌ EchoBots.gg button not found');
    }

    // Ad Modal functionality
    const adModal = document.getElementById('ad-modal');
    const watchAdBtn = document.getElementById('watch-ad-btn');
    const adCloseBtn = document.getElementById('ad-close-btn');
    const adClaimBtn = document.getElementById('ad-claim-btn');

    if (watchAdBtn && adModal) {
        watchAdBtn.onclick = () => {
            console.log('📺 Starting ad...');
            adModal.style.display = 'block';
            startAdTimer();
        };
        console.log('✅ Watch ad button connected');
    }

    if (adCloseBtn && adModal) {
        adCloseBtn.onclick = () => {
            console.log('❌ Closing ad...');
            adModal.style.display = 'none';
        };
        console.log('✅ Ad close button connected');
    }

    if (adClaimBtn) {
        adClaimBtn.onclick = () => {
            console.log('💰 Claiming ad reward...');
            coins += 10;
            saveGameProgress();
            updateCoinDisplay();
            alert('🎉 Je hebt 10 coins gekregen!');
            if (adModal) adModal.style.display = 'none';
        };
        console.log('✅ Ad claim button connected');
    }

    // Add click handlers for modal backgrounds (close on background click)
    [shopPanel, settingsModal, updateLog, adModal].forEach(modal => {
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    if (modal.classList.contains('show')) {
                        modal.classList.remove('show');
                    }
                }
            };
        }
    });

    console.log('✅ All UI buttons initialized');
}

function startAdTimer() {
    const countdown = document.getElementById('ad-countdown');
    const claimBtn = document.getElementById('ad-claim-btn');
    const progress = document.getElementById('ad-progress');

    let timeLeft = 5;

    if (claimBtn) claimBtn.disabled = true;

    const timer = setInterval(() => {
        timeLeft--;
        if (countdown) countdown.textContent = timeLeft;
        if (progress) progress.style.width = `${((5 - timeLeft) / 5) * 100}%`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            if (claimBtn) {
                claimBtn.disabled = false;
                claimBtn.textContent = '🎉 Claim 10 Coins';
            }
            console.log('📺 Ad finished, coins can be claimed');
        }
    }, 1000);
}

// ================================
// SHOP SYSTEM
// ================================

// Shop data
const shopItems = {
    // Outfits
    defaultSkin: { type: 'outfit', price: 0, owned: true, equipped: true, name: 'Default Runner', effect: 'default' },
    speedSkin: { type: 'outfit', price: 150, owned: false, equipped: false, name: 'Speed Demon', effect: 'speed' },
    ghostSkin: { type: 'outfit', price: 200, owned: false, equipped: false, name: 'Ghost Walker', effect: 'ghost' },
    tankSkin: { type: 'outfit', price: 300, owned: false, equipped: false, name: 'Tank Armor', effect: 'tank' },
    rainbowSkin: { type: 'outfit', price: 500, owned: false, equipped: false, name: 'Rainbow Master', effect: 'rainbow' },
    neonSkin: { type: 'outfit', price: 400, owned: false, equipped: false, name: 'Neon Racer', effect: 'neon' },

    // Powers
    doubleJump: { type: 'power', price: 75, owned: false, name: 'Double Jump', uses: 0 },
    timeSlower: { type: 'power', price: 120, owned: false, name: 'Time Slower', uses: 0 },
    coinRain: { type: 'power', price: 90, owned: false, name: 'Coin Rain', uses: 0 },
    megaShield: { type: 'power', price: 200, owned: false, name: 'Mega Shield', uses: 0 },

    // Boosts
    speed: { type: 'boost', price: 10, name: 'Speed Boost' },
    shield: { type: 'boost', price: 25, name: 'Extra Shield' },
    magnet: { type: 'boost', price: 50, name: 'Coin Magnet' }
};

function initializeShop() {
    console.log('🛒 Initializing shop system...');

    // Load shop data from localStorage
    const savedShop = localStorage.getItem('shopData');
    if (savedShop) {
        try {
            const shopData = JSON.parse(savedShop);
            Object.assign(shopItems, shopData);
        } catch (error) {
            console.error('❌ Failed to load shop data:', error);
        }
    }

    console.log('✅ Shop data loaded');
}

function initializeShopButtons() {
    console.log('🔘 Initializing shop buttons...');

    // Setup buy buttons
    const buyButtons = document.querySelectorAll('.buy-btn');
    console.log(`🔍 Found ${buyButtons.length} buy buttons`);

    buyButtons.forEach((button, index) => {
        const itemId = button.getAttribute('data-item');
        console.log(`Button ${index + 1}: ${itemId}`);

        if (itemId) {
            button.onclick = () => {
                console.log(`🖱️ Button clicked: ${itemId}`);
                purchaseItem(itemId);
            };
            updateButtonState(itemId, button);
        } else {
            console.warn(`❌ Button ${index + 1} has no data-item attribute`);
        }
    });

    console.log('✅ Shop buttons initialized');
}

function purchaseItem(itemId) {
    console.log(`🛒 Attempting to purchase: ${itemId}`);
    const item = shopItems[itemId];

    if (!item) {
        console.error(`❌ Item ${itemId} not found`);
        alert(`Fout: Item ${itemId} niet gevonden!`);
        return;
    }

    console.log(`💰 Current coins: ${coins}, Item price: ${item.price}`);

    // Check if already owned (for outfits/powers)
    if (item.owned && item.type !== 'boost') {
        if (item.type === 'outfit') {
            equipOutfit(itemId);
        } else if (item.type === 'power') {
            // Use power if owned
            if (item.uses > 0) {
                item.uses--;
                console.log(`⚡ Used ${item.name}, remaining uses: ${item.uses}`);
                alert(`⚡ ${item.name} gebruikt! Nog ${item.uses} keer beschikbaar.`);
                saveShopData();
                updateCoinDisplay();
                return;
            }
        }
        console.log(`✅ ${item.name} activated/equipped`);
        return;
    }

    // Check if player has enough coins
    if (coins < item.price) {
        console.log(`❌ Not enough coins! Need ${item.price}, have ${coins}`);
        alert(`Je hebt niet genoeg coins!\n\nNodig: ${item.price} 🪙\nHebt: ${coins} 🪙\n\nSpeel meer games om coins te verdienen!`);
        return;
    }

    // Purchase item
    coins -= item.price;
    console.log(`💸 Spent ${item.price} coins, remaining: ${coins}`);

    // Handle different item types
    if (item.type === 'outfit') {
        item.owned = true;
        equipOutfit(itemId);
        alert(`🎽 ${item.name} gekocht en uitgerust!\n\nJe nieuwe outfit is nu actief.`);
        console.log(`🎽 Purchased and equipped ${item.name}`);
    } else if (item.type === 'power') {
        item.owned = true;
        item.uses += 3; // Give 3 uses
        alert(`⚡ ${item.name} gekocht!\n\n+3 uses toegevoegd.\nTotaal: ${item.uses} uses beschikbaar.`);
        console.log(`⚡ Purchased ${item.name} - 3 uses added`);
    } else if (item.type === 'boost') {
        // Boosts are consumable, apply immediately to next game
        applyBoost(itemId);
        alert(`🚀 ${item.name} gekocht!\n\nBoost wordt toegepast in je volgende game.`);
        console.log(`🚀 Purchased ${item.name} boost`);
    }

    // Save progress
    saveShopData();
    saveGameProgress();
    updateCoinDisplay();

    // Update ALL button states
    const allBuyButtons = document.querySelectorAll('.buy-btn');
    allBuyButtons.forEach(button => {
        const id = button.getAttribute('data-item');
        if (id && shopItems[id]) {
            updateButtonState(id, button);
        }
    });

    console.log(`💰 Purchase complete! Remaining coins: ${coins}`);
}

function equipOutfit(itemId) {
    // Unequip all other outfits
    Object.keys(shopItems).forEach(id => {
        if (shopItems[id].type === 'outfit') {
            shopItems[id].equipped = false;
        }
    });

    // Equip new outfit
    shopItems[itemId].equipped = true;
    player.activeSkin = itemId;

    // Update all outfit buttons
    document.querySelectorAll('[data-item]').forEach(button => {
        const id = button.getAttribute('data-item');
        if (shopItems[id] && shopItems[id].type === 'outfit') {
            updateButtonState(id, button);
        }
    });

    console.log(`👔 Equipped ${shopItems[itemId].name}`);
}

function updateButtonState(itemId, button) {
    const item = shopItems[itemId];

    if (item.type === 'outfit') {
        if (item.equipped) {
            button.textContent = 'Uitgerust';
            button.className = 'buy-btn equipped';
            button.disabled = true;
        } else if (item.owned) {
            button.textContent = 'Selecteer';
            button.className = 'buy-btn owned';
            button.disabled = false;
        } else {
            button.textContent = 'Koop';
            button.className = 'buy-btn';
            button.disabled = coins < item.price;
        }
    } else if (item.type === 'power') {
        if (item.owned && item.uses > 0) {
            button.textContent = `Gebruik (${item.uses}x)`;
            button.className = 'buy-btn owned';
            button.disabled = false;
        } else if (item.owned) {
            button.textContent = 'Koop meer';
            button.className = 'buy-btn';
            button.disabled = coins < item.price;
        } else {
            button.textContent = 'Koop';
            button.className = 'buy-btn';
            button.disabled = coins < item.price;
        }
    } else {
        button.textContent = 'Koop';
        button.className = 'buy-btn';
        button.disabled = coins < item.price;
    }
}

function applyBoost(boostId) {
    // Apply boost effects for next game
    switch (boostId) {
        case 'speed':
            player.moveSpeed = 1.2;
            console.log('🏃 Speed boost applied for next game');
            break;
        case 'shield':
            player.lives += 1;
            console.log('🛡️ Extra life added for next game');
            break;
        case 'magnet':
            scoreMultiplier = 0.5; // Double coin earning
            console.log('🧲 Coin magnet activated for next game');
            break;
    }
}

function saveShopData() {
    try {
        localStorage.setItem('shopData', JSON.stringify(shopItems));
        console.log('💾 Shop data saved');
    } catch (error) {
        console.error('❌ Failed to save shop data:', error);
    }
}

// ================================
// SPECIAL GAME MODES
// ================================

let chaosTimer = 0;
let speedrunStartTime = 0;
let survivalStartTime = 0;
let coinrushStartTime = 0;
let chaosEffects = ['speed', 'reverse', 'bigPlayer', 'smallPlayer', 'invisible', 'doubleCoins', 'shield'];
let currentChaosEffect = null;

function setupGameMode(mode) {
    console.log(`🎯 Setting up ${mode} mode...`);

    switch (mode) {
        case 'chaos':
            chaosTimer = 0;
            currentChaosEffect = null;
            console.log('🌪️ Chaos mode initialized - Random effects every 5 seconds!');
            break;

        case 'speedrun':
            speedrunStartTime = Date.now();
            speed = baseSpeed * 1.5; // Start faster
            console.log('⚡ Speedrun mode - Race to 1000 points!');
            break;

        case 'survival':
            survivalStartTime = Date.now();
            player.lives = 1; // Only 1 life
            speed = baseSpeed * 0.8; // Start slower but ramp up fast
            console.log('🛡️ Survival mode - One life, survive as long as possible!');
            break;

        case 'coinrush':
            coinrushStartTime = Date.now();
            scoreMultiplier = 2; // Double coins
            speed = baseSpeed * 1.2;
            console.log('💰 Coin Rush mode - Collect 100 coins as fast as possible!');
            break;

        case 'nightmare':
            speed = baseSpeed * 1.3; // Faster from start
            player.lives = 1; // One life
            console.log('😈 Nightmare mode - Extreme difficulty activated!');
            break;

        default:
            console.log(`🎮 Standard ${mode} mode setup`);
    }
}

function applyChaosEffect() {
    // Remove previous effect
    if (currentChaosEffect) {
        removeChaosEffect(currentChaosEffect);
    }

    // Apply new random effect
    currentChaosEffect = chaosEffects[Math.floor(Math.random() * chaosEffects.length)];

    switch (currentChaosEffect) {
        case 'speed':
            speed *= 1.5;
            console.log('🌪️ CHAOS: Super Speed!');
            break;
        case 'reverse':
            // Reverse controls for 5 seconds
            console.log('🌪️ CHAOS: Reverse Controls!');
            break;
        case 'bigPlayer':
            player.w = 60;
            player.h = 60;
            console.log('🌪️ CHAOS: Giant Player!');
            break;
        case 'smallPlayer':
            player.w = 20;
            player.h = 20;
            console.log('🌪️ CHAOS: Tiny Player!');
            break;
        case 'invisible':
            console.log('🌪️ CHAOS: Invisible Player!');
            break;
        case 'doubleCoins':
            scoreMultiplier *= 2;
            console.log('🌪️ CHAOS: Double Coins!');
            break;
        case 'shield':
            player.lives += 1;
            console.log('🌪️ CHAOS: Temporary Shield!');
            break;
    }
}

function removeChaosEffect(effect) {
    switch (effect) {
        case 'speed':
            speed = baseSpeed + (score / 1000);
            break;
        case 'bigPlayer':
        case 'smallPlayer':
            player.w = 40;
            player.h = 40;
            break;
        case 'doubleCoins':
            scoreMultiplier = 0.25;
            break;
    }
}

function checkGameModeWinConditions() {
    switch (gameMode) {
        case 'speedrun':
            if (score >= 1000) {
                const timeElapsed = Date.now() - speedrunStartTime;
                console.log(`⚡ Speedrun completed in ${timeElapsed / 1000}s!`);
                endGame(true, `🎉 SPEEDRUN COMPLETE!\nTime: ${(timeElapsed / 1000).toFixed(2)}s\nScore: ${Math.floor(score)}`);
                return true;
            }
            break;

        case 'coinrush':
            if (coinsThisRun >= 100) {
                const timeElapsed = Date.now() - coinrushStartTime;
                console.log(`💰 Coin Rush completed in ${timeElapsed / 1000}s!`);
                endGame(true, `🎉 COIN RUSH COMPLETE!\nTime: ${(timeElapsed / 1000).toFixed(2)}s\nCoins: ${coinsThisRun}`);
                return true;
            }
            break;
    }
    return false;
}

function updateGameModeLogic() {
    switch (gameMode) {
        case 'chaos':
            chaosTimer++;
            if (chaosTimer >= 300) { // 5 seconds at 60fps
                applyChaosEffect();
                chaosTimer = 0;
            }
            break;

        case 'survival':
            // Increase difficulty faster in survival mode
            const survivalTime = (Date.now() - survivalStartTime) / 1000;
            speed = baseSpeed + (survivalTime * 0.1);
            break;

        case 'nightmare':
            // Double obstacle spawn rate
            if (Math.random() < 0.005) {
                spawnObstacle();
            }
            break;
    }
}

function adjustCanvasForGameMode() {
    if (!canvas) return;

    // Force reset all canvas styling 
    canvas.style.cssText = '';
    canvas.style.width = '';
    canvas.style.height = '';
    canvas.style.maxWidth = '';
    canvas.style.maxHeight = '';
    canvas.style.transform = '';
    canvas.style.position = '';
    canvas.style.top = '';
    canvas.style.left = '';

    // Set internal canvas resolution only
    canvas.width = 480;  // Fixed game resolution  
    canvas.height = 640;

    console.log(`🖥️ Canvas style reset: ${canvas.width}x${canvas.height}`);
}

// Resize handler disabled - using fixed canvas size
/*
window.addEventListener('resize', () => {
    if (document.body.classList.contains('game-mode')) {
        adjustCanvasForGameMode();
    }
});
*/

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        console.log('🧹 Cleanup: Animation frames cancelled on page unload');
    }
});

// Cleanup on visibility change (tab switching)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameRunning) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            console.log('👁️ Tab hidden: Pausing animation frames');
        }
    } else if (!document.hidden && gameRunning) {
        animationFrameId = requestAnimationFrame(gameLoop);
        console.log('👁️ Tab visible: Resuming animation frames');
    }
});

console.log('✅ Improved game engine loaded successfully');

// Test if everything is working
console.log('🔍 Debug info:');
console.log('Canvas:', canvas);
console.log('Context:', ctx);
console.log('Start screen:', startScreen);
console.log('Game info:', gameInfo);
