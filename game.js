// 🎱 Sinuquinha Online — versão completa + regras 8-ball
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

// grupos: null | "red" | "yellow"
let playerGroups = [null, null];
let gameOver = false;
let gameMessage = "";

// ================= BOLAS =================
const r = 10;
let balls = [
  { x: W / 2 - 140, y: H / 2, vx: 0, vy: 0, r, color: "white", cue: true },

  // grupo A
  { x: W / 2 + 40, y: H / 2 - 20, vx: 0, vy: 0, r, color: "red" },
  { x: W / 2 + 60, y: H / 2, vx: 0, vy: 0, r, color: "red" },

  // grupo B
  { x: W / 2 + 40, y: H / 2 + 20, vx: 0, vy: 0, r, color: "yellow" },
  { x: W / 2 + 60, y: H / 2 + 40, vx: 0, vy: 0, r, color: "yellow" },

  // bola preta
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
  if (gameOver) return;
  if (!allStopped()) return;
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
function drawHUD() {
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Vez: " + players[currentPlayer], 20, 25);

  if (playerGroups[currentPlayer]) {
    ctx.fillText(
      "Seu grupo: " + playerGroups[currentPlayer],
      20,
      45
    );
  }

  if (gameMessage) {
    ctx.font = "20px Arial";
    ctx.fillText(gameMessage, W / 2 - 120, 30);
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

  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i], b = balls[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + b.r) {
        const nx = dx / dist;
        const ny = dy / dist;
        const p = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        a.vx -= p * nx;
        a.vy -= p * ny;
        b.vx += p * nx;
        b.vy += p * ny;
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

        // branca
        if (ball.cue) {
          cueBall.x = W / 2 - 140;
          cueBall.y = H / 2;
          cueBall.vx = cueBall.vy = 0;
          currentPlayer = 1 - currentPlayer;
        }

        // bola preta
        else if (ball.eight) {
          const group = playerGroups[currentPlayer];
          const remaining = balls.some(
            b => b.color === group
          );

          if (!group || remaining) {
            gameOver = true;
            gameMessage = players[1 - currentPlayer] + " venceu!";
          } else {
            gameOver = true;
            gameMessage = players[currentPlayer] + " venceu!";
          }
        }

        // bolas normais
        else {
          if (!playerGroups[currentPlayer]) {
            playerGroups[currentPlayer] = ball.color;
            playerGroups[1 - currentPlayer] =
              ball.color === "red" ? "yellow" : "red";
          }
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
  drawHUD();

  if (
    allStopped() &&
    !charging &&
    ballsPocketedThisTurn.length === 0 &&
    !gameOver
  ) {
    currentPlayer = 1 - currentPlayer;
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
