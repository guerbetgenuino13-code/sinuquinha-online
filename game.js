// 🎱 Sinuquinha Online — bola + caçapas
console.log("Sinuquinha Online iniciado");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

// mesa
const margin = 40;

// caçapas
const pocketRadius = 18;
const pockets = [
  { x: margin, y: margin },
  { x: W / 2, y: margin },
  { x: W - margin, y: margin },
  { x: margin, y: H - margin },
  { x: W / 2, y: H - margin },
  { x: W - margin, y: H - margin },
];

// bola
const ball = {
  x: W / 2,
  y: H / 2,
  r: 10,
  vx: 0,
  vy: 0
};

function drawTable() {
  // madeira
  ctx.fillStyle = "#2b1b0f";
  ctx.fillRect(0, 0, W, H);

  // feltro
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

function updateBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  // atrito
  const friction = 0.99;
  ball.vx *= friction;
  ball.vy *= friction;

  // parar quando estiver lento
  if (Math.abs(ball.vx) < 0.05) ball.vx = 0;
  if (Math.abs(ball.vy) < 0.05) ball.vy = 0;

  // colisão com bordas
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
      // bola caiu
      ball.x = W / 2;
      ball.y = H / 2;
      ball.vx = 0;
      ball.vy = 0;
    }
  }
}

canvas.addEventListener("click", (e) => {
  if (ball.vx !== 0 || ball.vy !== 0) return;

  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const dx = mx - ball.x;
  const dy = my - ball.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return;

  const force = 8;
  ball.vx = (dx / dist) * force;
  ball.vy = (dy / dist) * force;
});

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
}

function gameLoop() {
  ctx.clearRect(0, 0, W, H);
  drawTable();
  drawPockets();
  updateBall();
  checkPocket();
  drawBall();
  requestAnimationFrame(gameLoop);
}

gameLoop();

gameLoop();

