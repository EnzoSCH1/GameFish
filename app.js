// ====== DOM
const layers = [...document.querySelectorAll(".layer")];
const bubblesEl = document.getElementById("bubbles");
const swimmersEl = document.getElementById("swimmers");
const entitiesEl = document.getElementById("entities");

const bossEl = document.getElementById("boss");
const cursorFish = document.getElementById("cursorFish");

// ✅ hitboxes
const playerRadius = 28;
const bossRadius = 95;

const levelEl = document.getElementById("level");
const scoreEl = document.getElementById("score");
const targetEl = document.getElementById("target");
const timeEl = document.getElementById("time");
const comboEl = document.getElementById("combo");

const totalEl = document.getElementById("total");
const bestEl = document.getElementById("best");

const dashEl = document.getElementById("dash");
const magnetEl = document.getElementById("magnet");

const btnPlay = document.getElementById("btnPlay"); // ✅ Commencer (overlay)
const btnStart = document.getElementById("btnStart"); // HUD
const btnReset = document.getElementById("btnReset");
const soundToggle = document.getElementById("soundToggle");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMsg = document.getElementById("overlayMsg");
const btnNext = document.getElementById("btnNext");
const btnRetry = document.getElementById("btnRetry");

// ✅ Rules box dans l'overlay
const rulesBox = document.getElementById("rules");

// ====== STATS UI
const statsBox = document.getElementById("stats");
const stTotal = document.getElementById("stTotal");
const stBest = document.getElementById("stBest");
const stLevel = document.getElementById("stLevel");
const stFood = document.getElementById("stFood");
const stBonus = document.getElementById("stBonus");
const stMalus = document.getElementById("stMalus");
const stPower = document.getElementById("stPower");
const stBossHits = document.getElementById("stBossHits");
const stMaxCombo = document.getElementById("stMaxCombo");

// ====== LocalStorage
const LS_BEST = "sea_fish_best";
let bestScore = Number(localStorage.getItem(LS_BEST) || "0");

// ====== Game state
let running = false;

let level = 1;
let score = 0;
let target = 15;

let baseTime = 30.0;
let timeLeft = 30.0;

let speed = 1.0;
let totalScore = 0;

// combo
let combo = 1;
let lastEatAt = 0;
const comboWindowMs = 650;

// souris + lissage
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let x = mouseX, y = mouseY;

// ====== Stats run (fin de run)
let eatenFood = 0;
let takenBonus = 0;
let takenMalus = 0;
let takenPower = 0;
let bossHits = 0;
let maxCombo = 1;

// ====== Power-ups
let dashCooldown = 0;
const dashCooldownMax = 3.0;
let dashTime = 0;
const dashTimeMax = 0.25;

let magnetTime = 0;
const magnetMax = 6.0;
const magnetRadius = 170;
const magnetPull = 14;

// ====== Boss (poursuite)
let bossActive = false;
let bossX = -9999, bossY = -9999;

let bossSpeed = 170;
let bossVX = 0, bossVY = 0;
let bossMaxAccel = 520;

let lastBossHitAt = 0;

// ====== Confettis bulles
let confettiBurstActive = false;

// ====== Audio (WebAudio)
let audioCtx = null;
function ensureAudio() {
  if (!soundToggle.checked) return null;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function blip({from=520, to=220, dur=0.12, gain=0.08, type="sine"}) {
  const ctx = ensureAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(to, now + dur);

  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  osc.connect(g);
  g.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + dur + 0.02);
}

const playMiam  = () => blip({from:560, to:240, dur:0.12, gain:0.09, type:"sine"});
const playBonus = () => blip({from:740, to:980, dur:0.10, gain:0.07, type:"triangle"});
const playOuch  = () => blip({from:220, to:90,  dur:0.16, gain:0.10, type:"sawtooth"});
const playDash  = () => blip({from:420, to:760, dur:0.09, gain:0.07, type:"square"});

// ====== UI helpers
function setRunningUI(isRunning){
  document.body.classList.toggle("game-running", isRunning);
}

function hideOverlay(){
  overlay.classList.add("hidden");
}

function showStatsBox(){
  if (!statsBox) return;
  statsBox.classList.remove("hidden");
}

function hideStatsBox(){
  if (!statsBox) return;
  statsBox.classList.add("hidden");
}

// ✅ garde UNE SEULE version de hideRules (tu en avais 2)
function hideRules(){
  if (rulesBox) rulesBox.classList.add("hidden");
}

// ✅ Démarrage depuis l’overlay (même logique que ton btnStart)
async function startGameFromOverlay(){
  hideRules();
  hideOverlay();
  hideStatsBox();

  running = true;
  btnStart.textContent = "Pause";
  setRunningUI(true);

  if (soundToggle.checked){
    const ctx = ensureAudio();
    if (ctx && ctx.state === "suspended") await ctx.resume();
  }

  lastFrame = 0;
  bubbleLoop();
  swimmersLoop();
  requestAnimationFrame(frame);
}

// ✅ Menu règles (début de jeu) — AUTO au chargement / refresh
function showRules(){
  overlayTitle.textContent = "Bienvenue dans Sea Game 🌊";
  overlayMsg.textContent = "Lis les règles pour comprendre le jeu.";

  overlay.classList.remove("hidden");
  overlay.classList.add("overlay-rules"); // ✅ IMPORTANT

  if (rulesBox) rulesBox.classList.remove("hidden");
  if (statsBox) statsBox.classList.add("hidden");

  if (btnPlay) btnPlay.style.display = "inline-block";
  btnNext.style.display = "none";
  btnRetry.style.display = "none";

  setRunningUI(false);
}


  
// ✅ Rendu stats (toujours à jour)
function renderStats(){
  if (!statsBox) return;

  stTotal.textContent = totalScore;
  stBest.textContent = bestScore;
  stLevel.textContent = level;

  stFood.textContent = eatenFood;
  stBonus.textContent = takenBonus;
  stMalus.textContent = takenMalus;
  stPower.textContent = takenPower;
  stBossHits.textContent = bossHits;
  stMaxCombo.textContent = `x${maxCombo}`;
}

function syncHUD(){
  levelEl.textContent = level;
  scoreEl.textContent = score;
  targetEl.textContent = target;
  timeEl.textContent = timeLeft.toFixed(1);
  comboEl.textContent = `x${combo}`;

  totalEl.textContent = totalScore;
  bestEl.textContent = bestScore;

  dashEl.textContent = dashCooldown > 0 ? `${dashCooldown.toFixed(1)}s` : "prêt";
  magnetEl.textContent = magnetTime > 0 ? `${magnetTime.toFixed(1)}s` : "off";

  renderStats();
}

// ✅ Overlay win/lose
function showOverlay(title, msg, mode){
  overlayTitle.textContent = title;
  overlayMsg.textContent = msg;

  overlay.classList.remove("hidden");
  overlay.classList.remove("overlay-rules"); // ❌ enlève le mode bienvenue

  hideRules();
  if (btnPlay) btnPlay.style.display = "none";

  if (mode === "win") {
    btnNext.style.display = "inline-block";
    btnRetry.style.display = "inline-block";
    btnRetry.textContent = "Recommencer";
  } else {
    btnNext.style.display = "none";
    btnRetry.style.display = "inline-block";
    btnRetry.textContent = "Rejouer";
  }

  setRunningUI(false);
}




// ====== Parallax
function updateParallax(){
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const dx = (mouseX - cx) / cx;
  const dy = (mouseY - cy) / cy;

  layers.forEach(layer => {
    const depth = Number(layer.dataset.depth || "0.1");
    const px = -dx * 55 * depth * 10;
    const py = -dy * 40 * depth * 10;
    layer.style.transform = `translate3d(${px}px, ${py}px, 0)`;
  });
}

// ====== Cursor follow
function updateCursor(){
  const follow = dashTime > 0 ? 0.42 : 0.18;

  const prevX = x;
  const prevY = y;

  x += (mouseX - x) * follow;
  y += (mouseY - y) * follow;

  const vx = x - prevX;
  const vy = y - prevY;

  if (!updateCursor.facing) updateCursor.facing = 1; // 1=right, -1=left
  if (Math.abs(vx) > 0.15) updateCursor.facing = vx >= 0 ? -1 : 1;

  const tilt = Math.max(-12, Math.min(12, -vy * 1.2));

  cursorFish.style.transform =
    `translate(-50%, -50%) translate(${x}px, ${y}px) scaleX(${updateCursor.facing}) rotate(${tilt}deg)`;
}

// ====== Entities
function createEntity(kind, px, py){
  const el = document.createElement("div");
  el.className = `entity ${kind}`;
  el.dataset.kind = kind;
  el.style.left = `${px}px`;
  el.style.top = `${py}px`;
  entitiesEl.appendChild(el);
  return el;
}

function spawnFood(count){
  const pad = 20;
  for (let i = 0; i < count; i++){
    createEntity(
      "food",
      Math.random() * (window.innerWidth - pad*2) + pad,
      Math.random() * (window.innerHeight - pad*2) + pad
    );
  }
}

function spawnBonus(){
  const pad = 30;
  createEntity(
    "bonus",
    Math.random() * (window.innerWidth - pad*2) + pad,
    Math.random() * (window.innerHeight - pad*2) + pad
  );
}

function spawnMalus(){
  const pad = 30;
  createEntity(
    "malus",
    Math.random() * (window.innerWidth - pad*2) + pad,
    Math.random() * (window.innerHeight - pad*2) + pad
  );
}

function spawnPowerUp(){
  const kind = Math.random() < 0.5 ? "power-dash" : "power-magnet";
  const pad = 30;
  createEntity(
    kind,
    Math.random() * (window.innerWidth - pad*2) + pad,
    Math.random() * (window.innerHeight - pad*2) + pad
  );
}

// ====== Magnet effect
function applyMagnet(){
  if (magnetTime <= 0) return;

  const foods = [...entitiesEl.querySelectorAll(".food")];
  for (const f of foods){
    const r = f.getBoundingClientRect();
    const fx = r.left + r.width/2;
    const fy = r.top + r.height/2;

    const dx = x - fx;
    const dy = y - fy;
    const dist = Math.hypot(dx, dy);

    if (dist < magnetRadius && dist > 1){
      const step = Math.min(magnetPull, (magnetRadius - dist) * 0.12);
      const nx = fx + (dx / dist) * step;
      const ny = fy + (dy / dist) * step;

      const halfW = f.offsetWidth / 2;
      const halfH = f.offsetHeight / 2;

      f.style.left = `${nx - halfW}px`;
      f.style.top  = `${ny - halfH}px`;
    }
  }
}

// ====== Eat detection
function checkEat(){
  const mouthX = x + 22;
  const mouthY = y;
  const now = performance.now();

  const ents = [...entitiesEl.querySelectorAll(".entity")];

  for (const el of ents){
    const r = el.getBoundingClientRect();
    const ex = r.left + r.width/2;
    const ey = r.top + r.height/2;
    const dist = Math.hypot(ex - mouthX, ey - mouthY);

    if (dist < playerRadius){
      const kind = el.dataset.kind;
      el.remove();

      if (kind === "food"){
        if (now - lastEatAt <= comboWindowMs) combo = Math.min(10, combo + 1);
        else combo = 1;
        lastEatAt = now;

        const gained = combo;
        score += gained;
        totalScore += gained;
        playMiam();

        eatenFood++;
        maxCombo = Math.max(maxCombo, combo);

        if (totalScore > bestScore){
          bestScore = totalScore;
          localStorage.setItem(LS_BEST, String(bestScore));
        }

        if (score >= target){
          winLevel();
          return;
        }

        if (entitiesEl.querySelectorAll(".food").length < 10){
          spawnFood(22);
        }
      }

      if (kind === "bonus"){
        takenBonus++;

        if (Math.random() < 0.6){
          timeLeft = Math.min(baseTime + 12, timeLeft + 6 + level * 0.4);
        } else {
          score += 5;
          totalScore += 5;
          if (totalScore > bestScore){
            bestScore = totalScore;
            localStorage.setItem(LS_BEST, String(bestScore));
          }
        }
        playBonus();
      }

      if (kind === "malus"){
        takenMalus++;
        combo = 1;
        timeLeft = Math.max(0, timeLeft - (4.5 + level * 0.35));
        playOuch();
      }

      if (kind === "power-dash"){
        takenPower++;
        dashCooldown = Math.max(0, dashCooldown - 1.2);
        playBonus();
      }

      if (kind === "power-magnet"){
        takenPower++;
        magnetTime = Math.max(magnetTime, magnetMax);
        playBonus();
      }

      syncHUD();
    }
  }
}

// ====== Boss init + follow
function initBoss(){
  bossActive = level >= 4;

  if (!bossActive){
    bossEl.style.left = "-9999px";
    bossEl.style.top = "-9999px";
    return;
  }

  const side = Math.floor(Math.random() * 4);
  const margin = 220;

  if (side === 0){ bossX = -margin; bossY = Math.random() * window.innerHeight; }
  if (side === 1){ bossX = window.innerWidth + margin; bossY = Math.random() * window.innerHeight; }
  if (side === 2){ bossX = Math.random() * window.innerWidth; bossY = -margin; }
  if (side === 3){ bossX = Math.random() * window.innerWidth; bossY = window.innerHeight + margin; }

  bossVX = 0;
  bossVY = 0;

  bossSpeed = 160 + level * 18;
  bossMaxAccel = 520 + level * 28;

  bossEl.style.left = `${bossX}px`;
  bossEl.style.top  = `${bossY}px`;
}

function updateBoss(dt){
  if (!bossActive) return;

  const isMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
const bossW = isMobile ? 380 : 520;
const bossH = isMobile ? 213 : 292;


  const bossCenterX = bossX + bossW / 2;
  const bossCenterY = bossY + bossH / 2;

  const targetX = x;
  const targetY = y;

  let dx = targetX - bossCenterX;
  let dy = targetY - bossCenterY;
  const dist = Math.hypot(dx, dy) || 1;

  dx /= dist;
  dy /= dist;

  const desiredVX = dx * bossSpeed;
  const desiredVY = dy * bossSpeed;

  let ax = desiredVX - bossVX;
  let ay = desiredVY - bossVY;

  const aLen = Math.hypot(ax, ay) || 1;
  const maxA = bossMaxAccel * dt;

  if (aLen > maxA){
    ax = (ax / aLen) * maxA;
    ay = (ay / aLen) * maxA;
  }

  bossVX += ax;
  bossVY += ay;

  bossX += bossVX * dt;
  bossY += bossVY * dt;

  bossY += Math.sin(performance.now() / 220) * 0.35;

  bossEl.style.transform = bossVX >= 0 ? "scaleX(-1)" : "scaleX(1)";

  const pad = 40;
  bossX = Math.max(-200, Math.min(window.innerWidth - pad, bossX));
  bossY = Math.max(-200, Math.min(window.innerHeight - pad, bossY));

  bossEl.style.left = `${bossX}px`;
  bossEl.style.top  = `${bossY}px`;

  const now = performance.now();
  const cdx = bossCenterX - x;
  const cdy = bossCenterY - y;
  const cdist = Math.hypot(cdx, cdy);

  if (cdist < bossRadius + playerRadius * 0.6 && now - lastBossHitAt > 650){
    lastBossHitAt = now;

    bossHits++;
    combo = 1;
    timeLeft = Math.max(0, timeLeft - (5.5 + level * 0.4));
    playOuch();
    syncHUD();
  }
}

// ====== Confettis bulles (burst)
function spawnConfettiBubblesBurst(count = 40){
  confettiBurstActive = true;

  for (let i = 0; i < count; i++){
    const b = document.createElement("div");
    b.className = "bubble";

    const size = 6 + Math.random() * 18;
    b.style.width = `${size}px`;
    b.style.height = `${size}px`;

    const cx = window.innerWidth / 2 + (Math.random() * 120 - 60);
    const cy = window.innerHeight / 2 + (Math.random() * 120 - 60);

    b.style.bottom = "auto";
    b.style.top = `${cy}px`;
    b.style.left = `${cx}px`;

    const drift = (Math.random() * 240 - 120);
    b.style.setProperty("--drift", `${drift}px`);

    const duration = 1.8 + Math.random() * 1.2;
    b.style.animationDuration = `${duration}s`;

    b.style.opacity = "0.9";

    bubblesEl.appendChild(b);
    b.addEventListener("animationend", () => b.remove());
  }

  setTimeout(() => { confettiBurstActive = false; }, 1200);
}

// ====== Décor: poissons nageurs
function createSwimmer(){
  const el = document.createElement("div");
  el.className = "swimmer";

  const fromLeft = Math.random() > 0.5;
  const y = 80 + Math.random() * (window.innerHeight - 160);
  const dur = (10 + Math.random() * 8) / (0.9 + speed * 0.25);

  el.style.top = `${y}px`;
  el.style.left = fromLeft ? `-140px` : `${window.innerWidth + 140}px`;
  el.style.transform = fromLeft ? "scaleX(1)" : "scaleX(-1)";
  swimmersEl.appendChild(el);

  const start = performance.now();
  const startX = fromLeft ? -140 : window.innerWidth + 140;
  const endX = fromLeft ? window.innerWidth + 140 : -140;

  function step(t){
    if (!el.isConnected) return;
    if (!running){ requestAnimationFrame(step); return; }

    const p = Math.min(1, (t - start) / (dur * 1000));
    const eased = p * (2 - p);
    const xPos = startX + (endX - startX) * eased;
    const bob = Math.sin((t - start) / 250) * 6;

    el.style.left = `${xPos}px`;
    el.style.transform = `${fromLeft ? "scaleX(1)" : "scaleX(-1)"} translateY(${bob}px)`;

    if (p < 1) requestAnimationFrame(step);
    else el.remove();
  }

  requestAnimationFrame(step);
}

function swimmersLoop(){
  if (!running) return;
  createSwimmer();

  const rate = Math.max(700, 2400 - level * 140);
  setTimeout(swimmersLoop, rate);
}

// ====== Bulles
function spawnBubble(){
  const b = document.createElement("div");
  b.className = "bubble";

  const size = 6 + Math.random() * 14;
  b.style.width = `${size}px`;
  b.style.height = `${size}px`;

  b.style.bottom = "-40px";
  b.style.top = "auto";
  b.style.left = `${Math.random() * window.innerWidth}px`;

  const duration = (6 + Math.random() * 6) / (0.85 + speed * 0.35);
  b.style.animationDuration = `${duration}s`;

  const drift = (Math.random() * 120 - 60);
  b.style.setProperty("--drift", `${drift}px`);

  bubblesEl.appendChild(b);
  b.addEventListener("animationend", () => b.remove());
}

function bubbleLoop(){
  if (!running) return;
  const rate = Math.max(120, 420 - level * 35);
  spawnBubble();
  setTimeout(bubbleLoop, rate);
}

// ====== Level logic
function configureLevel(){
  speed = 1 + (level - 1) * 0.18;
  target = 15 + (level - 1) * 8;

  baseTime = Math.max(18, 30 - (level - 1) * 1.2);
  timeLeft = baseTime;

  score = 0;
  combo = 1;
  lastEatAt = 0;

  dashCooldown = 0;
  dashTime = 0;
  magnetTime = 0;

  entitiesEl.innerHTML = "";
  spawnFood(40 + level * 2);

  if (level >= 2) spawnBonus();
  if (level >= 3) spawnMalus();
  if (level >= 5) spawnPowerUp();

  initBoss();
  syncHUD();
}

function winLevel(){
  running = false;
  btnStart.textContent = "Reprendre";

  hideStatsBox();
  spawnConfettiBubblesBurst(46);

  showOverlay(
    `Niveau ${level} réussi ✅`,
    `Total: ${totalScore} • Niveau suivant : ${level + 1}`,
    "win"
  );
}

function loseLevel(){
  running = false;
  btnStart.textContent = "Reprendre";

  showStatsBox();
  renderStats();

  showOverlay(
    `Fin de run ❌`,
    `Temps écoulé. Tu as atteint le niveau ${level}.`,
    "lose"
  );
}

// ====== Random spawns
let lastSpawnAt = 0;
function maybeSpawnRandom(){
  const now = performance.now();
  const interval = Math.max(2200, 5200 - level * 260);
  if (now - lastSpawnAt < interval) return;
  lastSpawnAt = now;

  const bonusChance = Math.min(0.38, 0.18 + level * 0.02);
  const malusChance = Math.min(0.28, 0.10 + level * 0.018);
  const powerChance = Math.min(0.22, 0.06 + level * 0.018);

  const roll = Math.random();

  if (roll < bonusChance) return void spawnBonus();
  if (roll < bonusChance + malusChance) return void spawnMalus();
  if (roll < bonusChance + malusChance + powerChance) return void spawnPowerUp();

  spawnFood(10);
}

// ====== Dash
function tryDash(){
  if (!running) return;
  if (dashCooldown > 0) return;

  dashTime = dashTimeMax;
  dashCooldown = dashCooldownMax;

  playDash();
  syncHUD();
}

// ====== Main loop
let lastFrame = 0;
function frame(t){
  if (!running) return;

  if (!lastFrame) lastFrame = t;
  const dt = Math.min(0.05, (t - lastFrame) / 1000);
  lastFrame = t;

  dashCooldown = Math.max(0, dashCooldown - dt);
  dashTime = Math.max(0, dashTime - dt);
  magnetTime = Math.max(0, magnetTime - dt);

  timeLeft -= dt;
  if (timeLeft <= 0){
    timeLeft = 0;
    syncHUD();
    loseLevel();
    return;
  }

  updateCursor();
  updateParallax();
  checkEat();
  applyMagnet();
  updateBoss(dt);
  maybeSpawnRandom();

  syncHUD();
  requestAnimationFrame(frame);
}

// ====== Controls
window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// clic droit = dash
window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  tryDash();
});

// ✅ Mobile/Tablette : déplacement au doigt (en plus de la souris)
window.addEventListener("pointermove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
}, { passive: true });

// ✅ Mobile dash button
const btnDashMobile = document.getElementById("btnDashMobile");

if (btnDashMobile){
  btnDashMobile.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    tryDash();
  });
}


// Space = dash + Enter = commencer sur règles
window.addEventListener("keydown", (e) => {
  // ✅ si menu règles visible => Entrée démarre
  if (e.code === "Enter" && !overlay.classList.contains("hidden") && rulesBox && !rulesBox.classList.contains("hidden")){
    e.preventDefault();
    startGameFromOverlay();
    return;
  }

  if (e.code === "Space"){
    e.preventDefault();
    tryDash();
  }
});

// ====== Buttons

// ✅ bouton "Commencer" (overlay) => on le cache sur les règles, mais si tu le gardes dans le HTML, il marche quand même
if (btnPlay){
  btnPlay.addEventListener("click", () => {
    startGameFromOverlay();
  });
}

btnStart.addEventListener("click", async () => {
  if (!running){
    hideRules();

    running = true;
    btnStart.textContent = "Pause";
    hideOverlay();
    hideStatsBox();

    setRunningUI(true);

    if (soundToggle.checked){
      const ctx = ensureAudio();
      if (ctx && ctx.state === "suspended") await ctx.resume();
    }

    lastFrame = 0;
    bubbleLoop();
    swimmersLoop();
    requestAnimationFrame(frame);
  } else {
    running = false;
    btnStart.textContent = "Reprendre";
    setRunningUI(false);
  }
});

btnReset.addEventListener("click", () => {
  level = 1;
  totalScore = 0;

  eatenFood = 0;
  takenBonus = 0;
  takenMalus = 0;
  takenPower = 0;
  bossHits = 0;
  maxCombo = 1;

  configureLevel();
  hideOverlay();
  hideStatsBox();

  running = false;
  btnStart.textContent = "Démarrer";
  setRunningUI(false);

  // ✅ au reset, on ré-affiche les règles (comme tu voulais)
  showRules();
});

// Continuer = niveau suivant
btnNext.addEventListener("click", () => {
  level++;
  configureLevel();
  hideOverlay();
  hideStatsBox();

  running = true;
  btnStart.textContent = "Pause";
  setRunningUI(true);

  lastFrame = 0;
  bubbleLoop();
  swimmersLoop();
  requestAnimationFrame(frame);
});

// btnRetry: WIN => recommencer / LOSE => rejouer niveau
btnRetry.addEventListener("click", () => {
  const isWinOverlay = btnNext.style.display !== "none";

  if (isWinOverlay){
    level = 1;
    totalScore = 0;

    eatenFood = 0;
    takenBonus = 0;
    takenMalus = 0;
    takenPower = 0;
    bossHits = 0;
    maxCombo = 1;

    configureLevel();
    hideOverlay();
    hideStatsBox();

    running = false;
    btnStart.textContent = "Démarrer";
    setRunningUI(false);
    syncHUD();

    // ✅ re-affiche règles quand on recommence totalement
    showRules();
    return;
  }

  configureLevel();
  hideOverlay();
  hideStatsBox();

  running = true;
  btnStart.textContent = "Pause";
  setRunningUI(true);

  lastFrame = 0;
  bubbleLoop();
  swimmersLoop();
  requestAnimationFrame(frame);
});

// ====== Init
bestEl.textContent = bestScore;
configureLevel();
syncHUD();
setRunningUI(false);

// ✅ affiche les règles au lancement (toujours, comme tu veux)
showRules();

