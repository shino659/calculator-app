const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const overlay = document.getElementById('overlay');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

const state = {
  score: 0,
  lives: 3,
  level: 1,
  isRunning: false,
  isPaused: false,
};

const paddle = {
  width: 110,
  height: 14,
  x: (GAME_WIDTH - 110) / 2,
  speed: 6,
  direction: 0,
};

const ball = {
  x: GAME_WIDTH / 2,
  y: GAME_HEIGHT - 60,
  radius: 8,
  speed: 4,
  velocityX: 3,
  velocityY: -4,
};

let bricks = [];
const brickConfig = {
  rowCount: 5,
  columnCount: 9,
  padding: 10,
  offsetTop: 40,
  offsetLeft: 35,
  width: 60,
  height: 18,
};

function createBricks() {
  bricks = [];
  for (let c = 0; c < brickConfig.columnCount; c += 1) {
    for (let r = 0; r < brickConfig.rowCount; r += 1) {
      const strength = Math.min(3, state.level + Math.floor(r / 2));
      bricks.push({
        x: (c * (brickConfig.width + brickConfig.padding)) + brickConfig.offsetLeft,
        y: (r * (brickConfig.height + brickConfig.padding)) + brickConfig.offsetTop,
        status: 1,
        strength,
      });
    }
  }
}

function resetBall() {
  ball.x = GAME_WIDTH / 2;
  ball.y = GAME_HEIGHT - 60;
  const speedScale = 1 + (state.level - 1) * 0.1;
  ball.velocityX = (Math.random() > 0.5 ? 3 : -3) * speedScale;
  ball.velocityY = -4 * speedScale;
}

function drawPaddle() {
  const gradient = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.width, 0);
  gradient.addColorStop(0, '#6cf0ff');
  gradient.addColorStop(1, '#51c3ff');
  ctx.fillStyle = gradient;
  ctx.fillRect(paddle.x, GAME_HEIGHT - paddle.height - 12, paddle.width, paddle.height);
}

function drawBall() {
  const glow = ctx.createRadialGradient(ball.x, ball.y, 2, ball.x, ball.y, 12);
  glow.addColorStop(0, '#fff');
  glow.addColorStop(1, 'rgba(108, 240, 255, 0)');
  ctx.beginPath();
  ctx.fillStyle = glow;
  ctx.arc(ball.x, ball.y, ball.radius * 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = '#ffc857';
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawBricks() {
  bricks.forEach((brick) => {
    if (brick.status !== 1) return;
    const { x, y, strength } = brick;
    const colors = ['#6cf0ff', '#5ef7c6', '#ffc857'];
    const color = colors[(strength - 1) % colors.length];
    ctx.fillStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.fillRect(x, y, brickConfig.width, brickConfig.height);
    ctx.shadowBlur = 0;
  });
}

function drawHUD() {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(0, 0, GAME_WIDTH, 32);
  ctx.fillStyle = '#e8ecf1';
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${state.score}`, 12, 20);
  ctx.textAlign = 'center';
  ctx.fillText(`Lives: ${state.lives}`, GAME_WIDTH / 2, 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Level: ${state.level}`, GAME_WIDTH - 12, 20);
}

function draw() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  drawHUD();
  drawBricks();
  drawPaddle();
  drawBall();
}

function collisionDetection() {
  bricks.forEach((brick) => {
    if (brick.status !== 1) return;
    if (
      ball.x > brick.x &&
      ball.x < brick.x + brickConfig.width &&
      ball.y > brick.y &&
      ball.y < brick.y + brickConfig.height
    ) {
      ball.velocityY = -ball.velocityY;
      brick.strength -= 1;
      if (brick.strength <= 0) {
        brick.status = 0;
        state.score += 100;
      } else {
        state.score += 30;
      }
    }
  });
}

function updatePaddle() {
  paddle.x += paddle.speed * paddle.direction;
  if (paddle.x < 8) paddle.x = 8;
  if (paddle.x + paddle.width > GAME_WIDTH - 8) paddle.x = GAME_WIDTH - 8 - paddle.width;
}

function updateBall() {
  ball.x += ball.velocityX;
  ball.y += ball.velocityY;

  if (ball.x + ball.radius > GAME_WIDTH || ball.x - ball.radius < 0) {
    ball.velocityX = -ball.velocityX;
  }
  if (ball.y - ball.radius < 32) {
    ball.velocityY = -ball.velocityY;
  }

  const paddleTop = GAME_HEIGHT - paddle.height - 12;
  if (
    ball.y + ball.radius > paddleTop &&
    ball.y + ball.radius < paddleTop + paddle.height &&
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.width
  ) {
    const collidePoint = ball.x - (paddle.x + paddle.width / 2);
    const normalized = collidePoint / (paddle.width / 2);
    const maxBounceAngle = Math.PI / 3;
    const bounceAngle = normalized * maxBounceAngle;
    const speed = Math.hypot(ball.velocityX, ball.velocityY);
    ball.velocityX = speed * Math.sin(bounceAngle);
    ball.velocityY = -Math.abs(speed * Math.cos(bounceAngle));
  }

  if (ball.y + ball.radius > GAME_HEIGHT) {
    state.lives -= 1;
    updateStatus();
    if (state.lives <= 0) {
      endGame('ゲームオーバー... スタートで再挑戦！');
    } else {
      overlayMessage('ミス！スペースかスタートで再開');
      pauseGame();
      resetBall();
    }
  }
}

function updateStatus() {
  scoreEl.textContent = state.score;
  livesEl.textContent = state.lives;
  levelEl.textContent = state.level;
}

function overlayMessage(message) {
  overlay.textContent = message;
  overlay.classList.add('is-visible');
}

function hideOverlay() {
  overlay.classList.remove('is-visible');
  overlay.textContent = '';
}

function nextLevel() {
  state.level += 1;
  brickConfig.rowCount = Math.min(8, brickConfig.rowCount + 1);
  resetBall();
  createBricks();
  overlayMessage(`レベル ${state.level}！スタートで続行`);
  pauseGame();
  updateStatus();
}

function checkWin() {
  const remaining = bricks.filter((brick) => brick.status === 1);
  if (remaining.length === 0) {
    state.score += 500;
    if (state.level >= 5) {
      endGame('クリア！おめでとうございます！');
    } else {
      nextLevel();
    }
    updateStatus();
  }
}

function gameLoop() {
  if (!state.isRunning || state.isPaused) return;
  draw();
  collisionDetection();
  updatePaddle();
  updateBall();
  checkWin();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  state.score = 0;
  state.lives = 3;
  state.level = 1;
  state.isRunning = true;
  state.isPaused = false;
  paddle.x = (GAME_WIDTH - paddle.width) / 2;
  brickConfig.rowCount = 5;
  createBricks();
  resetBall();
  updateStatus();
  hideOverlay();
  gameLoop();
}

function pauseGame() {
  state.isPaused = true;
}

function resumeGame() {
  if (!state.isRunning) return;
  if (!state.isPaused) return;
  state.isPaused = false;
  hideOverlay();
  gameLoop();
}

function endGame(message) {
  state.isRunning = false;
  state.isPaused = false;
  overlayMessage(message);
}

function togglePause() {
  if (!state.isRunning) return;
  state.isPaused = !state.isPaused;
  if (state.isPaused) {
    overlayMessage('ポーズ中 - スペースか P で再開');
  } else {
    hideOverlay();
    gameLoop();
  }
}

startButton.addEventListener('click', () => {
  startGame();
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') paddle.direction = 1;
  if (event.key === 'ArrowLeft') paddle.direction = -1;
  if (event.key === ' ') {
    if (!state.isRunning) startGame();
    else if (state.isPaused) resumeGame();
  }
  if (event.key.toLowerCase() === 'p') {
    togglePause();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowRight' && paddle.direction === 1) paddle.direction = 0;
  if (event.key === 'ArrowLeft' && paddle.direction === -1) paddle.direction = 0;
});

createBricks();
draw();
overlayMessage('スタートでゲーム開始！');
updateStatus();
