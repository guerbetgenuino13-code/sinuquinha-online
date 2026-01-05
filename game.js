// 🎱 Sinuquinha Online — base completa + barra de força
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

// ================= BOLA =================
const ball = {
  x: W / 2,
  y: H / 2,
  r: 10,
  vx: 0,
  vy: 0
};

// ================= MOUSE / MIRA =================
let mouse = { x: 0, y: 0 };

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

// ================= FORÇA =================
let shotPower = 0;          // 0..1
let charging = false;
const maxForce = 14;

canvas.addEventListener("mousedown", () => {
  if (ball.vx !== 0 || ball.vy !== 0) return;
  charging = true;
});

canvas.addEventListener("mouseup", () => {
  if (!charging) return;
  charging = false;

  const dx = mouse.x - ball.x;
  const dy = mouse.y - ball.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return;

  const ux = dx / dist;
  const uy = dy / dist;

  const force = shotPower * maxForce;

  ball.vx = ux * force;
  ball.vy = uy * force;

  shotPower = 0;
});

// ================= DESENHO =================
function drawTable() {
  ctx.fillStyle = "#2b1b0f";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#0b6b3a";
  ctx.fillRect(
    margin,
    margin,
    W - margin * 2,
    H - margin * 2
  );
}

function drawPockets() {
  ctx.fillStyle = "black";
  pockets.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, pocketRadius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
}

// ================= TACO + MIRA =================
function drawAim() {
  if (ball.vx !== 0 || ball.vy !== 0) return;

  const dx = mouse.x - ball.x;
  const dy = mouse.y - ball.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return;

  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(ball.x, ball.y);
  ctx.lineTo(mouse.x, mouse.y);
  ctx.stroke();
  ctx.setLineDash([]);

  const ux = dx / dist;
  const uy = dy / dist;

  const stickLength = 80 + shotPower * 40;
  const offset = 14;

  ctx.strokeStyle = "#d2b48c";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(
    ball.x - ux * offset,
    ball.y - uy * offset
  );
  ctx.lineTo(
    ball.x - ux * (stickLength + offset),
    ball.y - uy * (stickLength + offset)
  );
  ctx.stroke();
}

// ================= BARRA DE FORÇA =================
function drawPowerBar() {
  const barX = W - 25;
  const barY = margin;
  const barH = H - margin * 2;
  const barW = 10;

  ctx.fillStyle = "#444";
  ctx.fillRect(barX, barY, barW, barH);

  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(
    barX,
    barY + barH * (1 - shotPower),
    barW,
    barH * shotPower
  );
}

// ================= FÍSICA =================
function updateBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  const friction = 0.99;
  ball.vx *= friction;
  ball.vy *= friction;

  if (Math.abs(ball.vx) < 0.05) ball.vx = 0;
  if (Math.abs(ball.vy) < 0.05) ball.vy = 0;

  if (ball.x - ball.r < margin || ball.x + ball.r > W - margin) {
    ball.vx *= -1;
  }
  if (ball.y - ball.r < margin || ball.y + ball.r > H - margin) {
    ball.vy *= -1;
  }
}

function checkPocket() {
  for (let p of pockets) {
    const dx = ball.x - p.x;
    const dy = ball.y - p.y;
    const dist = Math.hypot(dx, dy);

    if (dist < pocketRadius) {
      ball.x = W / 2;
      ball.y = H / 2;
      ball.vx = 0;
      ball.vy = 0;
    }
  }
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
  updateBall();
  checkPocket();
  drawBall();

  requestAnimationFrame(gameLoop);
}

gameLoop();
