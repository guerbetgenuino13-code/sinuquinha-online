// 🎱 Sinuquinha Online — 8-ball com bola na mão após falta
console.log("Sinuquinha Online iniciado");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

/* ================= MESA ================= */
const margin = 40;

/* ================= CAÇAPAS ================= */
const pocketRadius = 18;
const pockets = [
  { x: margin, y: margin },
  { x: W / 2, y: margin },
  { x: W - margin, y: margin },
  { x: margin, y: H - margin },
  { x: W / 2, y: H - margin },
  { x: W - margin, y: H - margin },
];

/* ================= JOGADORES ================= */
const players = ["Player 1", "Player 2"];
let currentPlayer = 0;
let playerGroups = [null, null];
let gameOver = false;

/* ================= HUD ================= */
let toastText = "";
let toastTimer = 0;
const TOAST_DURATION = 140;

function showToast(text) {
  toastText = text;
  toastTimer = TOAST_DURATION;
}

/* ================= BOLAS ================= */
const r = 10;
let balls = [
  { x: W / 2 - 140, y: H / 2, vx: 0, vy: 0, r, color: "white", cue: true },

  { x: W / 2 + 60, y: H / 2 - 30, vx: 0, vy: 0, r, color: "red" },
  { x: W / 2 + 80, y: H / 2, vx: 0, vy: 0, r, color: "red" },

  { x: W / 2 + 60, y: H / 2 + 30, vx: 0, vy: 0, r, color: "yellow" },
  { x: W / 2 + 80, y: H / 2 + 60, vx: 0, vy: 0, r, color: "yellow" },

  { x: W / 2 + 100, y: H / 2 + 15, vx: 0, vy: 0, r, color: "black", eight: true },
];

const cueBall = balls.find(b => b.cue);

/* ================= CONTROLE ================= */
let mouse = { x: 0, y: 0 };
let charging = false;
let shotPower = 0;
const maxForce = 14;

// controle de turno
let pocketedThisShot = [];
let shotInProgress = false;
let ballInHand = false;

canvas.addEventListener("mousemove", e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;

  // mover bola branca se estiver em "bola na mão"
  if (ballInHand) {
    cueBall.x = Math.max(
      margin + cueBall.r,
      Math.min(W - margin - cueBall.r, mouse.x)
    );
    cueBall.y = Math.max(
      margin + cueBall.r,
      Math.min(H - margin - cueBall.r, mouse.y)
    );
  }
});

canvas.addEventListener("mousedown", () => {
  if (gameOver) return;

  // se está em bola na mão, confirma posição
  if (ballInHand) {
    ballInHand = false;
    showToast("Bola posicionada");
    return;
  }

  if (!allStopped()) return;
  if (shotInProgress) return;

  charging = true;
});

canvas.addEventListener("mouseup", () => {
  if (!charging || gameOver || ballInHand) return;
  charging = false;

  const dx = mouse.x - cueBall.x;
  const dy = mouse.y - cueBall.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return;

  const force = shotPower * maxForce;
  cueBall.vx = (dx / dist) * force;
  cueBall.vy = (dy / dist) * force;

  shotPower = 0;
  pocketedThisShot = [];
  shotInProgress = true;
});

/* ================= DESENHO ================= */
function drawTable() {
  ctx.fillStyle = "#2b1b0f";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#0b6b3a";
  ctx.fillRect(margin, margin, W - margin * 2, H - margin * 2);
}

function drawPockets() {
  ctx.fillStyle = "black";
  pockets.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, pocketRadius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBalls() {
  balls.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
  });
}

/* ================= TACO + MIRA ================= */
function drawAim() {
  if (!allStopped() || gameOver || ballInHand) return;

  const dx = mouse.x - cueBall.x;
  const dy = mouse.y - cueBall.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return;

  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.moveTo(cueBall.x, cueBall.y);
  ctx.lineTo(mouse.x, mouse.y);
  ctx.stroke();
  ctx.setLineDash([]);

  const ux = dx / dist;
  const uy = dy / dist;
  const stickLength = 80 + shotPower * 40;

  ctx.strokeStyle = "#d2b48c";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cueBall.x - ux * 14, cueBall.y - uy * 14);
  ctx.lineTo(
    cueBall.x - ux * (stickLength + 14),
    cueBall.y - uy * (stickLength + 14)
  );
  ctx.stroke();
}

/* ================= BARRA DE FORÇA ================= */
function drawPowerBar() {
  if (ballInHand) return;

  const h = H - margin * 2;
  ctx.fillStyle = "#444";
  ctx.fillRect(W - 25, margin, 10, h);
  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(W - 25, margin + h * (1 - shotPower), 10, h * shotPower);
}

/* ================= HUD ================= */
function drawHUD() {
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(10, 10, 260, 70);
  ctx.fillStyle = "#fff";
  ctx.font = "14px Arial";
  ctx.fillText("Vez: " + players[currentPlayer], 20, 32);

  const g = playerGroups[currentPlayer];
  ctx.fillText("Grupo: " + (g || "não definido"), 20, 52);

  if (ballInHand) {
    ctx.fillText("BOLA NA MÃO", 180, 32);
  }

  if (toastTimer > 0) {
    ctx.globalAlpha = toastTimer / TOAST_DURATION;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(W / 2 - 160, 10, 320, 36);
    ctx.fillStyle = "#fff";
    ctx.fillText(
      toastText,
      W / 2 - ctx.measureText(toastText).width / 2,
      35
    );
    ctx.globalAlpha = 1;
    toastTimer--;
  }
}

/* ================= FÍSICA ================= */
function updateBalls() {
  balls.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
    b.vx *= 0.99;
    b.vy *= 0.99;
    if (Math.abs(b.vx) < 0.03) b.vx = 0;
    if (Math.abs(b.vy) < 0.03) b.vy = 0;
    if (b.x - b.r < margin || b.x + b.r > W - margin) b.vx *= -1;
    if (b.y - b.r < margin || b.y + b.r > H - margin) b.vy *= -1;
  });

  const restitution = 0.98;
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i], b = balls[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.r + b.r;
      if (dist === 0 || dist >= minDist) continue;

      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;
      a.x -= nx * overlap / 2;
      a.y -= ny * overlap / 2;
      b.x += nx * overlap / 2;
      b.y += ny * overlap / 2;

      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const vel = rvx * nx + rvy * ny;
      const impulse = -(1 + restitution) * vel / 2;
      a.vx -= impulse * nx;
      a.vy -= impulse * ny;
      b.vx += impulse * nx;
      b.vy += impulse * ny;
    }
  }
}

/* ================= CAÇAPAS ================= */
function checkPocket() {
  for (let i = balls.length - 1; i >= 0; i--) {
    for (let p of pockets) {
      if (Math.hypot(balls[i].x - p.x, balls[i].y - p.y) < pocketRadius) {
        pocketedThisShot.push(balls[i]);
        balls.splice(i, 1);
        break;
      }
    }
  }
}

/* ================= REGRAS 8-BALL ================= */
function resolveTurn() {
  if (!shotInProgress) return;
  shotInProgress = false;

  const cueFoul = pocketedThisShot.some(b => b.cue);
  const eightBall = pocketedThisShot.some(b => b.eight);

  if (eightBall) {
    gameOver = true;
    showToast(players[currentPlayer] + " perdeu (bola preta)");
    return;
  }

  if (cueFoul) {
    showToast("FALTA! Bola na mão");
    currentPlayer = 1 - currentPlayer;
    ballInHand = true;
    return;
  }

  const colored = pocketedThisShot.filter(b => !b.cue && !b.eight);
  if (colored.length > 0) {
    const color = colored[0].color;
    if (!playerGroups[currentPlayer]) {
      playerGroups[currentPlayer] = color;
      playerGroups[1 - currentPlayer] =
        color === "red" ? "yellow" : "red";
      showToast("Grupo definido: " + color);
    }
    showToast("Continua a vez");
  } else {
    currentPlayer = 1 - currentPlayer;
    showToast("Troca de vez");
  }
}

function allStopped() {
  return balls.every(b => b.vx === 0 && b.vy === 0);
}

/* ================= LOOP ================= */
function gameLoop() {
  ctx.clearRect(0, 0, W, H);

  if (charging) {
    shotPower += 0.015;
    if (shotPower > 1) shotPower = 1;
  }

  drawTable();
  drawPockets();
  drawAim();
  drawPowerBar();
  updateBalls();
  checkPocket();
  drawBalls();
  drawHUD();

  if (allStopped() && shotInProgress) {
    resolveTurn();
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
