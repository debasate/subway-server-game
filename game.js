const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

let gameRunning = false;
let player = { x: 220, y: 540, w: 40, h: 40, color: '#ff0', lane: 1 };
let lanes = [120, 220, 320];
let obstacles = [];
let speed = 4;
let score = 0;

function resetGame() {
    player.lane = 1;
    player.x = lanes[player.lane];
    player.y = 540;
    obstacles = [];
    speed = 4;
    score = 0;
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

function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawObstacles();
    drawScore();
    updateObstacles();
    if (Math.random() < 0.03) spawnObstacle();
    score++;
    speed += 0.001;
    if (checkCollision()) {
        gameRunning = false;
        setTimeout(() => {
            alert('Game Over! Score: ' + score);
            startScreen.style.display = 'block';
            canvas.style.display = 'none';
        }, 100);
        return;
    }
    if (gameRunning) requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
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

startBtn.onclick = () => {
    resetGame();
    startScreen.style.display = 'none';
    canvas.style.display = 'block';
    gameRunning = true;
    requestAnimationFrame(gameLoop);
};
