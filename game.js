// 🎱 Sinuquinha Online — regras + turnos
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

// ================= BOLAS =================
const r = 10;
let balls = [
  { x: W / 2 - 120, y: H / 2, vx: 0, vy: 0, r, color: "white", cue: true },
  { x: W / 2 + 40, y: H / 2 - 20, vx: 0, vy: 0, r, color: "red" },
  { x: W / 2 + 60, y: H / 2, vx: 0, vy: 0, r, color: "yellow" },
  { x: W / 2 + 60, y: H / 2 + 20, vx: 0, vy: 0, r, color: "blue" },
];

const cueBall = balls[0];

// ================= CONTROLE =================
let mouse = { x: 0, y: 0 };
let charging = false;
let shotPower = 0;
let ballsPocketedThisTurn = 0;

canvas.addEventListener("mousemove", e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});

canvas.addEventListener("mousedown", () => {
  if (!allStopped()) return;
  charging = true;
});

canvas.addEventListener("mouseup", () => {
  if (!charging) return;
  charging = false;

  const dx = mouse.x - cueBall.x;
  const dy = mouse.y - cueBall.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return;

  const force = shotPower * 14;
  cueBall.vx = (dx / dist) * force;
  cueBall.vy = (dy / dist) * force;
  shotPower = 0;
  ballsPocketedThisTurn = 0;
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

function drawHUD() {
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Vez: " + players[currentPlayer], 20, 25);
}

// ================= MIRA =================
function drawAim() {
  if (!allStopped()) return;

  const dx = mouse.x - cueBall.x;
  const dy = mouse.y - cueBall.y;
  const d = Math.hypot(dx, dy);
  if (d === 0) return;

  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.moveTo(cueBall.x, cueBall.y);
  ctx.lineTo(mouse.x, mouse.y);
  ctx.stroke();
  ctx.setLineDash([]);
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

function checkPocket() {
  for (let i = balls.length - 1; i >= 0; i--) {
    for (let p of pockets) {
      if (Math.hypot(balls[i].x - p.x, balls[i].y - p.y) < pocketRadius) {
        if (balls[i].cue) {
          cueBall.x = W / 2 - 120;
          cueBall.y = H / 2;
          cueBall.vx = cueBall.vy = 0;
          currentPlayer = 1 - currentPlayer;
        } else {
          balls.splice(i, 1);
          ballsPocketedThisTurn++;
        }
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
  updateBalls();
  checkPocket();
  drawBalls();
  drawHUD();

  if (allStopped() && !charging && ballsPocketedThisTurn === 0) {
    currentPlayer = 1 - currentPlayer;
    ballsPocketedThisTurn = -1;
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
