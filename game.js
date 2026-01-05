// 🎱 Sinuquinha Online — versão completa + HUD profissional (COLISÃO CORRIGIDA)
console.log("Sinuquinha Online iniciado");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

// ================= MESA =================
const margin = 40;

// ================= CAÇAPAS =================
const pocketRadius = 18;
const pockets = [
  { x: margin, y: margin },
  { x: W / 2, y: margin },
  { x: W - margin, y: margin },
  { x: margin, y: H - margin },
  { x: W / 2, y: H - margin },
  { x: W - margin, y: H - margin },
];

// ================= JOGADORES =================
const players = ["Player 1", "Player 2"];
let currentPlayer = 0;
let playerGroups = [null, null];
let gameOver = false;

// ================= HUD / FEEDBACK =================
let toastText = "";
let toastTimer = 0;
const TOAST_DURATION = 180;

function showToast(text) {
  toastText = text;
  toastTimer = TOAST_DURATION;
}

// ================= BOLAS =================
const r = 10;
let balls = [
  { x: W / 2 - 140, y: H / 2, vx: 0, vy: 0, r, color: "white", cue: true },

  { x: W / 2 + 40, y: H / 2 - 20, vx: 0, vy: 0, r, color: "red" },
  { x: W / 2 + 60, y: H / 2, vx: 0, vy: 0, r, color: "red" },

  { x: W / 2 + 40, y: H / 2 + 20, vx: 0, vy: 0, r, color: "yellow" },
  { x: W / 2 + 60, y: H / 2 + 40, vx: 0, vy: 0, r, color: "yellow" },

  { x: W / 2 + 80, y: H / 2 + 20, vx: 0, vy: 0, r, color: "black", eight: true },
];

const cueBall = balls.find(b => b.cue);

// ================= CONTROLE =================
let mouse = { x: 0, y: 0 };
let charging = false;
let shotPower = 0;
let ballsPocketedThisTurn = [];
const maxForce = 14;

canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

canvas.addEventListener("mousedown", () => {
  if (gameOver || !allStopped()) return;
  charging = true;
});

canvas.addEventListener("mouseup", () => {
  if (!charging || gameOver) return;
  charging = false;

  const dx = mouse.x - cueBall.x;
  const dy = mouse.y - cueBall.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return;

  const force = shotPower * maxForce;
  cueBall.vx = (dx / dist) * force;
  cueBall.vy = (dy / dist) * force;

  shotPower = 0;
  ballsPocketedThisTurn = [];
});

// ================= DESENHO =================
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

// ================= TACO + MIRA =================
function drawAim() {
  if (!allStopped() || gameOver) return;

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

// ================= BARRA DE FORÇA =================
function drawPowerBar() {
  const h = H - margin * 2;
  ctx.fillStyle = "#444";
  ctx.fillRect(W - 25, margin, 10, h);

  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(
    W - 25,
    margin + h * (1 - shotPower),
    10,
    h * shotPower
  );
}

// ================= HUD =================
function drawAdvancedHUD() {
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(10, 10, 260, 90);

  ctx.fillStyle = "#fff";
  ctx.font = "14px Arial";
  ctx.fillText("Vez: " + players[currentPlayer], 20, 30);

  const group = playerGroups[currentPlayer];
  ctx.fillText("Seu grupo: " + (group || "não definido"), 20, 50);

  if (group) {
    const remaining = balls.filter(b => b.color === group).length;
    ctx.fillText("Restantes: " + remaining, 20, 70);
  }

  if (toastTimer > 0 && toastText) {
    ctx.globalAlpha = Math.min(1, toastTimer / 30);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(W / 2 - 180, 10, 360, 40);

    ctx.fillStyle = "#fff";
    ctx.font = "18px Arial";
    ctx.fillText(
      toastText,
      W / 2 - ctx.measureText(toastText).width / 2,
      38
    );
    ctx.globalAlpha = 1;
    toastTimer--;
  }
}

// ================= FÍSICA =================
function updateBalls() {
  balls.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;

    b.vx *= 0.99;
    b.vy *= 0.99;

    if (Math.abs(b.vx) < 0.05) b.vx = 0;
    if (Math.abs(b.vy) < 0.05) b.vy = 0;

    if (b.x - b.r < margin || b.x + b.r > W - margin) b.vx *= -1;
    if (b.y - b.r < margin || b.y + b.r > H - margin) b.vy *= -1;
  });

  // 👉 COLISÃO CORRIGIDA (anti-bola-grudada)
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i];
      const b = balls[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.r + b.r;

      if (dist > 0 && dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;

        // separação física
        const overlap = minDist - dist;
        a.x -= nx * overlap / 2;
        a.y -= ny * overlap / 2;
        b.x += nx * overlap / 2;
        b.y += ny * overlap / 2;

        // troca de velocidade
        const dvx = a.vx - b.vx;
        const dvy = a.vy - b.vy;
        const impact = dvx * nx + dvy * ny;

        if (impact > 0) continue;

        a.vx -= impact * nx;
        a.vy -= impact * ny;
        b.vx += impact * nx;
        b.vy += impact * ny;
      }
    }
  }
}

// ================= CAÇAPAS + REGRAS =================
function checkPocket() {
  for (let i = balls.length - 1; i >= 0; i--) {
    for (let p of pockets) {
      if (Math.hypot(balls[i].x - p.x, balls[i].y - p.y) < pocketRadius) {
        const ball = balls[i];
        ballsPocketedThisTurn.push(ball);

        if (ball.cue) {
          cueBall.x = W / 2 - 140;
          cueBall.y = H / 2;
          cueBall.vx = cueBall.vy = 0;
          currentPlayer = 1 - currentPlayer;
          showToast("FALTA! Bola branca");
        }

        balls.splice(i, 1);
        break;
      }
    }
  }
}

function allStopped() {
  return balls.every(b => b.vx === 0 && b.vy === 0);
}

// ================= LOOP =================
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
  drawAdvancedHUD();

  if (
    allStopped() &&
    !charging &&
    ballsPocketedThisTurn.length === 0 &&
    !gameOver
  ) {
    currentPlayer = 1 - currentPlayer;
    showToast("Troca de vez");
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
