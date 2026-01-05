// 🎱 Sinuquinha Online — 8-ball COMPLETO + bola na mão (3 CORREÇÕES FINAIS)
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

let pocketedThisShot = [];
let shotInProgress = false;
let ballInHand = false;

let firstHitColor = null; // registra a cor da primeira bola tocada

let touchedOwnGroup = false; // se tocou alguma bola do próprio grupo
let calledPocket = null;      // índice da caçapa chamada (0..5)
let waitingPocketCall = false; // aguardando escolha da caçapa


canvas.addEventListener("mousemove", e => {
  const rct = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rct.left;
  mouse.y = e.clientY - rct.top;

  if (ballInHand) {
    let nx = Math.max(margin + cueBall.r, Math.min(W - margin - cueBall.r, mouse.x));
    let ny = Math.max(margin + cueBall.r, Math.min(H - margin - cueBall.r, mouse.y));

    // ❌ impedir sobrepor outras bolas
    const invalid = balls.some(
      b => !b.cue && Math.hypot(nx - b.x, ny - b.y) < cueBall.r + b.r
    );

    if (!invalid) {
      cueBall.x = nx;
      cueBall.y = ny;
    }
  }
});

canvas.addEventListener("mousedown", () => {
  if (gameOver) return;
// 🔔 chamada de caçapa da bola 8
if (waitingPocketCall) {
  const mx = mouse.x;
  const my = mouse.y;

  // verifica se clicou em alguma caçapa
  for (let i = 0; i < pockets.length; i++) {
    const p = pockets[i];
    if (Math.hypot(mx - p.x, my - p.y) <= pocketRadius) {
      calledPocket = i;
      waitingPocketCall = false;
      showToast("Caçapa chamada!");
      return; // NÃO inicia tacada agora
    }
  }
  return; // clique fora da caçapa não faz nada
}

  if (ballInHand) {
    ballInHand = false;
    showToast("Bola posicionada");
    return;
  }

  if (!allStopped() || shotInProgress) return;
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
firstHitColor = null; // reset do primeiro toque
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
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
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
  ctx.fillText("Grupo: " + (playerGroups[currentPlayer] || "não definido"), 20, 52);
  if (ballInHand) ctx.fillText("BOLA NA MÃO", 160, 32);

  if (toastTimer > 0) {
    ctx.globalAlpha = toastTimer / TOAST_DURATION;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(W / 2 - 160, 10, 320, 36);
    ctx.fillStyle = "#fff";
    ctx.fillText(toastText, W / 2 - ctx.measureText(toastText).width / 2, 35);
    ctx.globalAlpha = 1;
    toastTimer--;
  
  }
  if (waitingPocketCall) {
  ctx.fillStyle = "#ffcc00";
  ctx.fillText("Chame a caçapa da bola 8", 20, 72);
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

    // bordas corrigidas
    if (b.x - b.r < margin) { b.x = margin + b.r; b.vx *= -1; }
    if (b.x + b.r > W - margin) { b.x = W - margin - b.r; b.vx *= -1; }
    if (b.y - b.r < margin) { b.y = margin + b.r; b.vy *= -1; }
    if (b.y + b.r > H - margin) { b.y = H - margin - b.r; b.vy *= -1; }
  });

  const restitution = 0.98;
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i], b = balls[j];
      if (ballInHand && (a.cue || b.cue)) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.r + b.r;
      
      // registra o primeiro toque da bola branca
if (shotInProgress && !firstHitColor) {
  if (a.cue && !b.cue) firstHitColor = b.color;
  else if (b.cue && !a.cue) firstHitColor = a.color;
}

      if (shotInProgress && playerGroups[currentPlayer]) {
  if (
    (a.cue && b.color === playerGroups[currentPlayer]) ||
    (b.cue && a.color === playerGroups[currentPlayer])
  ) {
    touchedOwnGroup = true;
  }
}

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
        const ball = balls[i];
         if (ball.eight) {
    ball.pocketIndex = pockets.indexOf(p);
  }
        pocketedThisShot.push(ball);

        if (!ball.cue) balls.splice(i, 1);
        else { ball.vx = ball.vy = 0; }

        break;
      }
    }
  }
}

function groupCleared(playerIndex) {
  const group = playerGroups[playerIndex];
  if (!group) return false;
  return !balls.some(b => b.color === group);
}

/* ================= REGRAS ================= */
function resolveTurn() {
  if (!shotInProgress) return;
  shotInProgress = false;
  // FALTA: tocou primeiro na bola errada
if (
  playerGroups[currentPlayer] &&
  firstHitColor &&
  firstHitColor !== playerGroups[currentPlayer] &&
  !touchedOwnGroup
) {
  showToast("FALTA! Primeiro toque errado");
  currentPlayer = 1 - currentPlayer;
  ballInHand = true;
  return;
}


 const cueFoul = pocketedThisShot.some(b => b.cue);
const eightBall = pocketedThisShot.some(b => b.eight);
const colored = pocketedThisShot.filter(b => !b.cue && !b.eight);

if (eightBall) {
  const eight = pocketedThisShot.find(b => b.eight);

  if (!groupCleared(currentPlayer)) {
    gameOver = true;
    showToast(players[currentPlayer] + " perdeu (bola 8 antes da hora)");
    return;
  }

  if (calledPocket !== null && eight.pocketIndex === calledPocket) {
    gameOver = true;
    showToast(players[currentPlayer] + " venceu!");
  } else {
    gameOver = true;
    showToast(players[currentPlayer] + " perdeu (caçapa errada)");
  }
  return;
}
// 🔔 Exige chamada da caçapa da bola 8 quando o grupo for limpo
if (
  !gameOver &&
  playerGroups[currentPlayer] &&
  groupCleared(currentPlayer) &&
  balls.some(b => b.eight) &&
  calledPocket === null
) {
  waitingPocketCall = true;
  showToast("Chame a caçapa da bola 8");
  return;
}

  if (cueFoul) {
    showToast("FALTA! Bola na mão");
    currentPlayer = 1 - currentPlayer;
    ballInHand = true;
    return;
  }

  if (colored.length > 0) {
    const color = colored[0].color;

    if (playerGroups[currentPlayer] && color !== playerGroups[currentPlayer]) {
      showToast("FALTA! Bola errada");
      currentPlayer = 1 - currentPlayer;
      ballInHand = true;
      return;
    }

    if (!playerGroups[currentPlayer]) {
      playerGroups[currentPlayer] = color;
      playerGroups[1 - currentPlayer] = color === "red" ? "yellow" : "red";
      showToast("Grupo definido: " + color);
    } else {
      showToast("Continua a vez");
    }
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

  if (allStopped() && shotInProgress) resolveTurn();

  requestAnimationFrame(gameLoop);
}

gameLoop();
