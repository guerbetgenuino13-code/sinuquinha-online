// 🎱 Si// 🎱 Sinuquinha Online — base completa com múltiplas bolas
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

// ================= BOLAS =================
const ballRadius = 10;

const balls = [
  { x: W / 2 - 120, y: H / 2, vx: 0, vy: 0, r: ballRadius, color: "white", cue: true },
  { x: W / 2 + 40, y: H / 2 - 20, vx: 0, vy: 0, r: ballRadius, color: "red" },
  { x: W / 2 + 60, y: H / 2, vx: 0, vy: 0, r: ballRadius, color: "yellow" },
  { x: W / 2 + 60, y: H / 2 + 20, vx: 0, vy: 0, r: ballRadius, color: "blue" },
];

const cueBall = balls[0];

// ================= MOUSE / FORÇA =================
let mouse = { x: 0, y: 0 };
let charging = false;
let shotPower = 0;
const maxForce = 14;

canvas.addEventListener("mousemove", (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});

canvas.addEventListener("mousedown", () => {
  if (!isAllStopped()) return;
  charging = true;
});

canvas.addEventListener("mouseup", () => {
  if (!charging) return;
  charging = false;

  const dx = mouse.x - cueBall.x;
  const dy = mouse.y - cueBall.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return;

  const force = shotPower * maxForce;
  cueBall.vx = (dx / dist) * force;
  cueBall.vy = (dy / dist) * force;
  shotPower = 0;
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

// ================= MIRA =================
function drawAim() {
  if (!isAllStopped()) return;

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
  ctx.lineTo(cueBall.x - ux * (stickLength + 14), cueBall.y - uy * (stickLength + 14));
  ctx.stroke();
}

// ================= BARRA DE FORÇA =================
function drawPowerBar() {
  const h = H - margin * 2;
  ctx.fillStyle = "#444";
  ctx.fillRect(W - 25, margin, 10, h);

  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(W - 25, margin + h * (1 - shotPower), 10, h * shotPower);
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

  // colisão entre bolas
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i];
      const b = balls[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.r + b.r;

      if (dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;

        const p = (a.vx * nx + a.vy * ny - b.vx * nx - b.vy * ny);

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
      const dx = balls[i].x - p.x;
      const dy = balls[i].y - p.y;
      if (Math.hypot(dx, dy) < pocketRadius) {
        if (balls[i].cue) {
          balls[i].x = W / 2 - 120;
          balls[i].y = H / 2;
          balls[i].vx = balls[i].vy = 0;
        } else {
          balls.splice(i, 1);
        }
      }
    }
  }
}

function isAllStopped() {
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

  requestAnimationFrame(gameLoop);
}

gameLoop();
