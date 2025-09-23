const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const infinityBtn = document.getElementById('infinity-btn');
const levelBtn = document.getElementById('level-btn');
const gameInfo = document.getElementById('game-info');
const modeDisplay = document.getElementById('mode-display');
const levelDisplay = document.getElementById('level-display');

let gameRunning = false;
let gameMode = 'infinity'; // 'infinity' or 'level'
let currentLevel = 1;
let levelProgress = 0;
let levelTarget = 1000; // Score needed to complete level

let player = { x: 220, y: 540, w: 40, h: 40, color: '#ff0', lane: 1 };
let lanes = [120, 220, 320];
let obstacles = [];
let speed = 4;
let score = 0;
let baseSpeed = 4;

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
    obstacles = [];
    score = 0;
    currentLevel = 1;
    levelProgress = 0;

    if (gameMode === 'infinity') {
        speed = 4;
        baseSpeed = 4;
    } else {
        speed = levels[0].maxSpeed * 0.5;
        baseSpeed = speed;
        levelTarget = levels[0].target;
    }

    updateGameInfo();
}

function updateGameInfo() {
    if (gameMode === 'infinity') {
        modeDisplay.textContent = 'Mode: Infinity';
        levelDisplay.textContent = `Score: ${score}`;
    } else {
        modeDisplay.textContent = `Mode: Level ${currentLevel}`;
        levelDisplay.textContent = `Progress: ${score}/${levelTarget}`;
    }
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
}

function drawObstacles() {
    ctx.fillStyle = '#f00';
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
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

function updateObstacles() {
    for (let obs of obstacles) {
        obs.y += speed;
    }
    obstacles = obstacles.filter(obs => obs.y < canvas.height);
}

function checkCollision() {
    for (let obs of obstacles) {
        if (
            obs.x < player.x + player.w &&
            obs.x + obs.w > player.x &&
            obs.y < player.y + player.h &&
            obs.y + obs.h > player.y
        ) {
            return true;
        }
    }
    return false;
}

function updateGameLogic() {
    if (gameMode === 'infinity') {
        // Infinity mode: gradually increase speed
        speed += 0.001;
        score++;
    } else {
        // Level mode: check for level completion
        score++;

        if (score >= levelTarget && currentLevel < levels.length) {
            // Level completed!
            currentLevel++;
            const newLevel = levels[currentLevel - 1];
            speed = newLevel.maxSpeed * 0.5;
            baseSpeed = speed;
            levelTarget = newLevel.target;

            // Brief pause and notification
            setTimeout(() => {
                alert(`Level ${currentLevel - 1} Complete!\nEntering: ${newLevel.name}`);
            }, 100);
        } else if (score >= levelTarget && currentLevel >= levels.length) {
            // Game completed!
            gameRunning = false;
            setTimeout(() => {
                alert(`🎉 GAME COMPLETED! 🎉\nYou finished all levels!\nFinal Score: ${score}`);
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
}

function getSpawnRate() {
    if (gameMode === 'infinity') {
        return 0.03;
    } else {
        return levels[currentLevel - 1].spawnRate;
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawObstacles();
    drawLevelInfo();
    updateObstacles();

    if (Math.random() < getSpawnRate()) {
        spawnObstacle();
    }

    updateGameLogic();

    if (checkCollision()) {
        gameRunning = false;
        setTimeout(() => {
            let message = `Game Over!\nScore: ${score}`;
            if (gameMode === 'level') {
                message += `\nReached Level: ${currentLevel}`;
            }
            alert(message);
            backToMenu();
        }, 100);
        return;
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
        player.x = lanes[player.lane];
    }
    if (e.key === 'ArrowRight' && player.lane < 2) {
        player.lane++;
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
