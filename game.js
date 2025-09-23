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
let speed = 7;
let baseSpeed = 7;
let scoreMultiplier = 0.25;

// Game elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
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
        // Stop any existing game
        if (gameRunning) {
            gameRunning = false;
            console.log('🛑 Stopped previous game');
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
        requestAnimationFrame(gameLoop);

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

    console.log(`✅ Game reset complete - Player at x:${player.x}, lane:${player.lane}`);
}

/**
 * Show game screen and hide menu
 */
function showGameScreen() {
    if (startScreen) startScreen.style.display = 'none';
    if (canvas) canvas.style.display = 'block';
    if (gameInfo) gameInfo.style.display = 'block';

    // Center layout
    document.body.style.display = 'block';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';

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

    if (startScreen) startScreen.style.display = 'block';
    if (canvas) canvas.style.display = 'none';
    if (gameInfo) gameInfo.style.display = 'none';

    // Hide mobile controls
    if (isMobile) {
        hideMobileControls();
    }

    // Restore menu layout
    document.body.style.display = 'flex';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
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
        ctx.strokeStyle = '#333';
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
    // Clear canvas
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw lanes
    for (let i = 0; i < 3; i++) {
        const laneCenter = lanes[i] + 20;

        // Lane lines
        ctx.strokeStyle = '#34495E';
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

    // Tunnel walls
    ctx.fillStyle = '#1A252F';
    ctx.fillRect(0, 0, 100, canvas.height);
    ctx.fillRect(380, 0, 100, canvas.height);
}

function drawPlayer() {
    const { x, y, w, h } = player;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 3, y + 3, w, h);

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
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 8, y + 10, 4, 4);
    ctx.fillRect(x + 28, y + 10, 4, 4);
}

function drawObstacles() {
    obstacles.forEach(obs => {
        const { x, y, w, h } = obs;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x + 2, y + 2, w, h);

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

    // Coins
    ctx.fillText(`💰 ${coinsThisRun}`, 10, 60);

    // Mode info
    ctx.font = '16px Arial';
    ctx.fillText(`Mode: ${gameMode}`, 10, canvas.height - 40);

    if (gameMode === 'level') {
        ctx.fillText(`Level: ${currentLevel}`, 10, canvas.height - 20);
    }

    // Multiplayer ranking
    if (isMultiplayer) {
        drawMultiplayerUI();
    }
}

function drawMultiplayerUI() {
    // Update ranking
    const allPlayers = [
        { name: 'You', score: score, alive: player.lives > 0, isPlayer: true },
        ...bots.map(bot => ({ name: bot.name, score: bot.score, alive: bot.alive, isPlayer: false }))
    ];
    playerRanking = allPlayers.sort((a, b) => b.score - a.score);

    // Draw ranking panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
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

    // Update coins
    const newCoins = Math.floor(score / 100) - Math.floor((score - scoreMultiplier) / 100);
    if (newCoins > 0) {
        coinsThisRun += newCoins;
        coins += newCoins;
        localStorage.setItem('subwayCoins', coins.toString());
    }

    // Update speed (progressive difficulty)
    const speedIncrease = Math.min(Math.floor(score / 250) * 0.3, 8);
    speed = baseSpeed + speedIncrease;

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

    // Spawn obstacles
    const spawnRate = Math.min(0.005 + (score / 10000), 0.04);
    if (Math.random() < spawnRate) {
        spawnObstacle();
    }
}

function endGame() {
    gameRunning = false;

    let message = `Game Over!\nFinal Score: ${Math.floor(score)}`;

    if (isMultiplayer) {
        const playerPosition = playerRanking.findIndex(p => p.isPlayer) + 1;
        if (player.lives > 0) {
            message = `🎉 VICTORY! 🎉\nYou won!\nFinal Score: ${Math.floor(score)}`;
        } else {
            message = `Game Over!\nPosition: ${playerPosition}/${playerRanking.length}\nFinal Score: ${Math.floor(score)}`;
        }
    }

    console.log(message);

    setTimeout(() => {
        backToMenu();
    }, 3000);
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
// AUDIO SYSTEM
// ================================

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

function gameLoop() {
    if (!gameRunning || !ctx) return;

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
        if (player.lives <= 0) {
            endGame();
            return;
        }
    }

    // Continue loop
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// ================================
// INITIALIZATION
// ================================

// Make startGame globally available
window.startGame = startGame;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Game engine initialized');

    // Initialize mobile controls
    if (isMobile) {
        initMobileControls();
    }

    // Setup button event listeners
    const buttons = {
        'infinity-btn': () => startGame('infinity'),
        'level-btn': () => startGame('level'),
        'multiplayer-btn': () => startGame('multiplayer')
    };

    Object.entries(buttons).forEach(([id, handler]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.onclick = handler;
            console.log(`✅ Button ${id} connected`);
        }
    });

    // Load saved coins
    coins = parseInt(localStorage.getItem('subwayCoins') || '0');

    console.log('🚀 Game ready to play!');
});

console.log('✅ Improved game engine loaded successfully');