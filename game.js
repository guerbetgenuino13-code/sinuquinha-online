// 🎱 Sinuquinha Online — base do jogo
console.log("Sinuquinha Online iniciado");

// canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

// mesa
function drawTable() {
  // fundo externo
  ctx.fillStyle = "#2b1b0f";
  ctx.fillRect(0, 0, W, H);

  // feltro
  const margin = 40;
  ctx.fillStyle = "#0b6b3a";
  ctx.fillRect(
    margin,
    margin,
    W - margin * 2,
    H - margin * 2
  );

  // bordas
  ctx.strokeStyle = "#3e2a14";
  ctx.lineWidth = 8;
  ctx.strokeRect(
    margin,
    margin,
    W - margin * 2,
    H - margin * 2
  );
}

// loop principal
function gameLoop() {
  ctx.clearRect(0, 0, W, H);
  drawTable();
  requestAnimationFrame(gameLoop);
}

// start
gameLoop();
