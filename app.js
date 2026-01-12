// =========================
// Sea Fish Game - app.js
// (4 upgrades random + rarity + reroll progressive)
// XP + upgrades = RUN ONLY (reset on lose)
// =========================

// ---------- DOM ----------
const layers = [...document.querySelectorAll(".layer")];
const bubblesEl = document.getElementById("bubbles");
const swimmersEl = document.getElementById("swimmers");
const entitiesEl = document.getElementById("entities");

const bossEl = document.getElementById("boss");
const cursorFish = document.getElementById("cursorFish");

const levelEl  = document.getElementById("level");
const scoreEl  = document.getElementById("score");
const targetEl = document.getElementById("target");
const timeEl   = document.getElementById("time");
const comboEl  = document.getElementById("combo");

const totalEl = document.getElementById("total");
const bestEl  = document.getElementById("best");


const dashFill = document.getElementById("dashFill");
const dashCooldownUI = document.getElementById("dashCooldownUI");
const dashCooldownFill = document.getElementById("dashCooldownFill");

const btnPlay  = document.getElementById("btnPlay");
const btnStart = document.getElementById("btnStart");
const btnReset = document.getElementById("btnReset");
const btnNext  = document.getElementById("btnNext");
const btnRetry = document.getElementById("btnRetry");

const soundToggle = document.getElementById("soundToggle");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMsg = document.getElementById("overlayMsg");
const rulesBox = document.getElementById("rules");
const statsBox = document.getElementById("stats");
const actionsEl = overlay ? overlay.querySelector(".actions") : null;

// stats fields
const stTotal = document.getElementById("stTotal");
const stBest = document.getElementById("stBest");
const stLevel = document.getElementById("stLevel");
const stFood = document.getElementById("stFood");
const stBonus = document.getElementById("stBonus");
const stMalus = document.getElementById("stMalus");
const stPower = document.getElementById("stPower");
const stBossHits = document.getElementById("stBossHits");
const stMaxCombo = document.getElementById("stMaxCombo");

// upgrades UI
const upgradesBox = document.getElementById("upgrades");
const xpTotalUI = document.getElementById("xpTotalUI");
const btnReroll = document.getElementById("btnReroll");
const btnSkipUpgrade = document.getElementById("btnSkipUpgrade");

// 4 cartes = 4 premiers .upgrade-card
const upgradeCards = upgradesBox
  ? [...upgradesBox.querySelectorAll(".upgrade-card")].slice(0, 4)
  : [];

// levels display (facultatif dans ton HTML)
const upSpeedLv  = document.getElementById("upSpeedLv");
const upRadiusLv = document.getElementById("upRadiusLv");
const upDashLv   = document.getElementById("upDashLv");

// ---------- Constants ----------
const LS_BEST = "sea_fish_best";
let bestScore = Number(localStorage.getItem(LS_BEST) || "0");

// Hitboxes
const playerRadiusBase = 28;

// Combo
const comboWindowMs = 650;

// Magnet
const magnetMax = 6.0;
const magnetRadius = 170;
const magnetPull = 14;

// Dash
const dashTimeMax = 0.25;

// Boss
const bossRadius = 95;

// =========================
// META XP + SKINS (persistant)
// =========================
const LS_META_XP = "sea_meta_xp";
const LS_META_MAX = "sea_meta_xp_max";
const LS_UNLOCKED_SKINS = "sea_unlocked_skins";
const LS_SEEN_SKINS = "sea_seen_skins";
const LS_EQUIP_CURSOR = "sea_equip_cursor";
const LS_EQUIP_BOSS = "sea_equip_boss";

// barre meta
let metaXP = Number(localStorage.getItem(LS_META_XP) || "0");
let metaXPMax = Number(localStorage.getItem(LS_META_MAX) || "350"); // départ 350

// inventaire
let unlockedSkins = new Set(JSON.parse(localStorage.getItem(LS_UNLOCKED_SKINS) || "[]"));
let seenSkins = new Set(JSON.parse(localStorage.getItem(LS_SEEN_SKINS) || "[]"));

// équipé
let equippedCursor = localStorage.getItem(LS_EQUIP_CURSOR) || "cursor_base";
let equippedBoss = localStorage.getItem(LS_EQUIP_BOSS) || "boss_base";

// placeholders (tu remplaceras src plus tard par tes vraies images)
const CURSOR_SKINS = [
  { id:"cursor_base", name:"Classique", rarity:"common", oneIn: 1, src:"assets/fish/skins/cursor.png" },
  { id:"cursor_1", name:"Guppy", rarity:"common",    oneIn: 5,   src:"assets/fish/skins/cursor.png" },
  { id:"cursor_2", name:"Truite", rarity:"common",   oneIn: 5,   src:"assets/fish/skins/cursor.png" },
  { id:"cursor_3", name:"Sardine", rarity:"rare",    oneIn: 25,  src:"assets/fish/skins/cursor.png" },
  { id:"cursor_4", name:"Poisson-ange", rarity:"rare", oneIn: 25, src:"assets/fish/skins/cursor.png" },
  { id:"cursor_5", name:"Koi", rarity:"epic",       oneIn: 120, src:"assets/fish/skins/cursor.png" },
  { id:"cursor_6", name:"Légendaire", rarity:"legendary", oneIn: 400, src:"assets/fish/skins/cursor.png" },
];

const BOSS_SKINS = [
  { id:"boss_base", name:"Classique", rarity:"common",  oneIn: 1,   src:"assets/fish/skins/boss.png" },
  { id:"boss_1", name:"Requin", rarity:"common",     oneIn: 8,   src:"assets/fish/skins/boss.png" },
  { id:"boss_2", name:"Requin bleu", rarity:"rare",  oneIn: 40,  src:"assets/fish/skins/boss.png" },
  { id:"boss_3", name:"Mégalodon", rarity:"epic",    oneIn: 160, src:"assets/fish/skins/boss.png" },
  { id:"boss_4", name:"Apex", rarity:"legendary",    oneIn: 600, src:"assets/fish/skins/boss.png" },
];

function saveMeta(){
  localStorage.setItem(LS_META_XP, String(metaXP));
  localStorage.setItem(LS_META_MAX, String(metaXPMax));
  localStorage.setItem(LS_UNLOCKED_SKINS, JSON.stringify([...unlockedSkins]));
  localStorage.setItem(LS_SEEN_SKINS, JSON.stringify([...seenSkins]));
  localStorage.setItem(LS_EQUIP_CURSOR, equippedCursor);
  localStorage.setItem(LS_EQUIP_BOSS, equippedBoss);
}

// UI meta
const metaXPFill = document.getElementById("metaXPFill");
const metaXPText = document.getElementById("metaXPText");
const aquariumBadge = document.getElementById("aquariumBadge");

// applique les skins équipés
function applyEquippedSkins(){
  const cur = CURSOR_SKINS.find(s => s.id === equippedCursor);
  if (cur && cursorFish) cursorFish.style.backgroundImage = `url("${cur.src}")`;

  const boss = BOSS_SKINS.find(s => s.id === equippedBoss);
  if (boss && bossEl) bossEl.style.backgroundImage = `url("${boss.src}")`;
}

// badge = skins débloqués non vus
function updateAquariumBadge(){
  if (!aquariumBadge) return;

  let unseen = 0;
  for (const id of unlockedSkins){
    if (!seenSkins.has(id)) unseen++;
  }

  if (unseen > 0){
    aquariumBadge.textContent = String(unseen);
    aquariumBadge.classList.remove("hidden");
  } else {
    aquariumBadge.classList.add("hidden");
  }
}

function renderMetaBar(){
  if (metaXPFill){
    const pct = Math.max(0, Math.min(1, metaXP / metaXPMax));
    metaXPFill.style.width = `${pct * 100}%`;
  }
  if (metaXPText){
    metaXPText.textContent = `XP: ${metaXP} / ${metaXPMax}`;
  }
  updateAquariumBadge();
}

// Débloquer un skin selon rareté (1 chance sur X)
function tryUnlockOneSkin(){
  const pool = [...CURSOR_SKINS, ...BOSS_SKINS].filter(s => !unlockedSkins.has(s.id));
  if (pool.length === 0) return null;

  // on tente dans l’ordre: legendary -> epic -> rare -> common
  const order = ["legendary", "epic", "rare", "common"];

  for (const r of order){
    const candidates = pool.filter(s => s.rarity === r);
    if (!candidates.length) continue;

    const sample = candidates[Math.floor(Math.random() * candidates.length)];
    // 1 chance sur X
    if (Math.floor(Math.random() * sample.oneIn) === 0){
      unlockedSkins.add(sample.id);
      saveMeta();
      return sample;
    }
  }
  return null;
}

// Ajout de meta XP ; si barre pleine -> unlock
function addMetaXP(amount){
  metaXP += amount;

  // boucle si tu remplis plusieurs fois d’un coup
  while (metaXP >= metaXPMax){
    metaXP -= metaXPMax;

    const unlocked = tryUnlockOneSkin();

    // montée progressive de la barre
    metaXPMax = Math.min(600, Math.floor(metaXPMax * 1.22 + 12));

    // si unlock, on marque "non vu"
    // (donc badge augmente)
    if (unlocked){
      // ne pas l’ajouter à seenSkins => il reste “non vu”
      saveMeta();
    }
  }

  saveMeta();
  renderMetaBar();
}


// ---------- RUN ONLY PROGRESS ----------
let runXP = 0;
let runUpSpeed = 0;    // infinite (soft-capped in effect)
let runUpRadius = 0;   // infinite (soft-capped in effect)
let runUpDash = 0;     // infinite (soft-capped in effect)
let upgradeChosenThisWin = false;

// Reroll (MUST be declared before any use)
let rerollCount = 0;
const REROLL_BASE_COST = 5;
const REROLL_STEP = 2; // +2 XP each reroll on same win screen

// Rarity table
const RARITIES = [
  { key:"common",    label:"⚪ Commun",     w: 65, costMul: 1.0, effect: 1 },
  { key:"rare",      label:"🔵 Rare",       w: 20, costMul: 1.5, effect: 2 },
  { key:"epic",      label:"🟣 Épique",     w: 10, costMul: 2.0, effect: 3 },
  { key:"legendary", label:"🟡 Légendaire", w: 3,  costMul: 3.0, effect: 5 },
];

const UPGRADE_TYPES = [
  { key:"speed",  title:"⚡ Vitesse", desc:"Ton poisson suit plus vite.", base: 5, step: 1 },
  { key:"radius", title:"🥫 Portée",  desc:"Mange plus facilement.",      base: 6, step: 1 },
  { key:"dash",   title:"🌊 Dash",    desc:"Dash plus fréquent.",         base: 7, step: 2 },
];

// 4 offers shown on win
let currentOffers = [];

// ---------- GAME STATE ----------
let running = false;

let level = 1;
let score = 0;
let target = 15;

let baseTime = 30.0;
let timeLeft = 30.0;

let speed = 1.0;
let totalScore = 0;

// Combo state
let combo = 1;
let lastEatAt = 0;

// Cursor smoothing
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let x = mouseX, y = mouseY;

// Run stats
let eatenFood = 0;
let takenBonus = 0;
let takenMalus = 0;
let takenPower = 0;
let bossHits = 0;
let maxCombo = 1;

// Power-up state
let dashCooldown = 0;
let dashCooldownMax = 3.0;
let dashTime = 0;

let magnetTime = 0;

// Boss movement state
let bossActive = false;
let bossX = -9999, bossY = -9999;
let bossSpeed = 200;
let bossVX = 0, bossVY = 0;
let bossMaxAccel = 550;
let lastBossHitAt = 0;

// Confetti bubbles flag
let confettiBurstActive = false;

// ---------- Audio ----------
let audioCtx = null;

function ensureAudio() {
  if (!soundToggle?.checked) return null;
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

// ---------- UI Helpers ----------
function setRunningUI(isRunning){
  document.body.classList.toggle("game-running", isRunning);
}

function hideOverlay(){
  overlay?.classList.add("hidden");
}

function showStatsBox(){
  statsBox?.classList.remove("hidden");
}

function hideStatsBox(){
  statsBox?.classList.add("hidden");
}

function hideRules(){
  rulesBox?.classList.add("hidden");
}

function hideOverlayActions(){
  actionsEl?.classList.add("hidden");
}

function showOverlayActions(){
  actionsEl?.classList.remove("hidden");
}

function showUpgradesBox(){
  upgradesBox?.classList.remove("hidden");
}

function hideUpgradesBox(){
  upgradesBox?.classList.add("hidden");
}

function canBuy(cost){
  return runXP >= cost;
}

// ---------- RUN RESET ----------
function resetRunProgress(){
  runXP = 0;
  runUpSpeed = 0;
  runUpRadius = 0;
  runUpDash = 0;

  upgradeChosenThisWin = false;
  rerollCount = 0;
  currentOffers = [];

  hideUpgradesBox();
  updateRerollButton();
  renderOffers(); // safe even if no offers
}

// ---------- Stats Render ----------
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

  // ✅ BARRE DE DASH (0 → vide / 1 → prêt)
  if (dashCooldownFill){
    const pct = dashCooldownMax <= 0
      ? 1
      : (1 - Math.min(1, dashCooldown / dashCooldownMax));

    dashCooldownFill.style.width = `${pct * 100}%`;
  }

  renderStats();
}

// ---------- Rules Screen ----------
function showRules(){
  resetRunProgress();

  overlayTitle.textContent = "Bienvenue dans Sea Fish Game 🌊";
  overlayMsg.textContent = "Lis les règles puis clique sur Démarrer.";

  overlay.classList.remove("hidden");
  overlay.classList.add("overlay-rules");

  rulesBox?.classList.remove("hidden");
  statsBox?.classList.add("hidden");

  if (btnPlay) {
    btnPlay.style.display = "inline-block";
    btnPlay.textContent = "Démarrer";
  }

  btnNext.style.display = "none";
  btnRetry.style.display = "none";

  hideUpgradesBox();
  showOverlayActions();
  setRunningUI(false);
}

// ---------- Overlay ----------
function showOverlay(title, msg, mode){
  overlayTitle.textContent = title;
  overlayMsg.textContent = msg;

  overlay.classList.remove("hidden");
  overlay.classList.remove("overlay-rules");

  hideRules();
  if (btnPlay) btnPlay.style.display = "none";

  // ✅ par défaut
  hideUpgradesBox();
  showOverlayActions();

  // ✅ cacher "Passer" par défaut (important)
  if (btnSkipUpgrade) btnSkipUpgrade.classList.add("hidden");

  if (mode === "win"){
    // prepare offers + reroll
    upgradeChosenThisWin = false;
    rerollCount = 0;

    rollOffers();
    renderOffers();

    showUpgradesBox();
    hideOverlayActions();

    // no need "Continuer" button (tu continues via upgrade ou passer)
    btnNext.style.display = "none";

    btnRetry.style.display = "inline-block";
    btnRetry.textContent = "Recommencer";

    // ✅ afficher "Passer" sur l'écran upgrades
    if (btnSkipUpgrade) btnSkipUpgrade.classList.remove("hidden");

  } else {
    // lose
    btnNext.style.display = "none";
    btnRetry.style.display = "inline-block";
    btnRetry.textContent = "Rejouer";

    hideUpgradesBox();
    showOverlayActions();

    // ✅ on s'assure que "Passer" reste caché
    if (btnSkipUpgrade) btnSkipUpgrade.classList.add("hidden");
  }

  setRunningUI(false);
}

// ---------- Rarity / Offers / Reroll ----------
function pickRarity(){
  // ✅ early game: seulement Commun/Rare
  if (level <= 5) {
    return Math.random() < 0.75 ? RARITIES[0] : RARITIES[1]; // 75% common, 25% rare
  }

  // mid game: commun/rare/épique
  if (level <= 12) {
    const roll = Math.random();
    if (roll < 0.60) return RARITIES[0];
    if (roll < 0.92) return RARITIES[1];
    return RARITIES[2];
  }

  // late game: tout possible
  const total = RARITIES.reduce((s,r)=>s+r.w,0);
  let x = Math.random() * total;
  for (const r of RARITIES){
    x -= r.w;
    if (x <= 0) return r;
  }
  return RARITIES[0];
}


function getTypeLevel(type){
  if (type === "speed") return runUpSpeed;
  if (type === "radius") return runUpRadius;
  if (type === "dash") return runUpDash;
  return 0;
}

function isTypeUseful(type){
  // soft caps for offers
  if (type === "speed"){
    const follow = Math.min(0.78, 0.18 + runUpSpeed * 0.015);
    return follow < 0.78 - 1e-6;
  }
  if (type === "radius"){
    const bonus = Math.min(80, runUpRadius * 4);
    return bonus < 80 - 1e-6;
  }
  if (type === "dash"){
    const cd = Math.max(0.6, 3.0 - runUpDash * 0.12);
    return cd > 0.6 + 1e-6;
  }
  return true;
}

function computeCost(type, rarity){
  const u = UPGRADE_TYPES.find(x=>x.key===type);
  const lvl = Math.floor(getTypeLevel(type));
  const raw = u.base + lvl * u.step;
  return Math.max(1, Math.ceil(raw * rarity.costMul));
}

function rollOffers(){
  const want = 4;
  const offers = [];
  const used = new Set();

  let safety = 0;
  while (offers.length < want && safety++ < 200){
    const rarity = pickRarity();
    const type = UPGRADE_TYPES[Math.floor(Math.random() * UPGRADE_TYPES.length)].key;

    if (!isTypeUseful(type)) continue;

    const sig = type + ":" + rarity.key;
    if (used.has(sig)) continue;
    used.add(sig);

    const cost = computeCost(type, rarity);
    offers.push({ type, rarity, cost });
  }

  while (offers.length < want){
    const rarity = RARITIES[0];
    const type = UPGRADE_TYPES[Math.floor(Math.random() * UPGRADE_TYPES.length)].key;
    offers.push({ type, rarity, cost: computeCost(type, rarity) });
  }

  currentOffers = offers;
}

function updateRerollButton(){
  if (!btnReroll) return;
  const cost = REROLL_BASE_COST + rerollCount * REROLL_STEP;
  btnReroll.textContent = `Reroll (${cost} XP)`;
  btnReroll.disabled = upgradeChosenThisWin || runXP < cost;
}

function doReroll(){
  if (upgradeChosenThisWin) return;
  const cost = REROLL_BASE_COST + rerollCount * REROLL_STEP;
  if (runXP < cost) return;

  runXP -= cost;
  rerollCount++;

  rollOffers();
  renderOffers();
  updateRerollButton();
}

function renderOffers(){
  if (xpTotalUI) xpTotalUI.textContent = runXP;

  // show levels (optional labels)
  if (upSpeedLv) upSpeedLv.textContent = Math.floor(runUpSpeed);
  if (upRadiusLv) upRadiusLv.textContent = Math.floor(runUpRadius);
  if (upDashLv) upDashLv.textContent = Math.floor(runUpDash);

  if (!upgradeCards || upgradeCards.length === 0) return;

  upgradeCards.forEach((btn, i) => {
    const offer = currentOffers[i];
    if (!btn || !offer) return;

    const u = UPGRADE_TYPES.find(x=>x.key===offer.type);
    const can = !upgradeChosenThisWin && runXP >= offer.cost;

    btn.disabled = !can;
    btn.style.opacity = btn.disabled ? "0.55" : "1";

     // ✅ applique la rareté pour le CSS
  btn.dataset.rarity = offer.rarity.key;
  btn.classList.remove("rarity-common","rarity-rare","rarity-epic","rarity-legendary");
  btn.classList.add(`rarity-${offer.rarity.key}`);

    btn.innerHTML = `
      <div class="u-title">${u.title} <span style="opacity:.85">${offer.rarity.label}</span></div>
      <div class="u-desc">${u.desc}</div>
      <div class="u-level" style="margin-top:8px;opacity:.9">
        Coût: <b>${offer.cost}</b> XP • +<b>${offer.rarity.effect}</b>
      </div>
    `;

    btn.onclick = () => {
      if (btn.disabled) return;
      applyOffer(offer);
    };
  });

  updateRerollButton();
}

function applyOffer(offer){
  if (upgradeChosenThisWin) return;
  if (runXP < offer.cost) return;

  runXP -= offer.cost;

  if (offer.type === "speed")  runUpSpeed  += offer.rarity.effect;
  if (offer.type === "radius") runUpRadius += offer.rarity.effect;
  if (offer.type === "dash")   runUpDash   += offer.rarity.effect;

  // soft caps
  runUpSpeed = Math.min(runUpSpeed, 60);
  runUpRadius = Math.min(runUpRadius, 25);
  runUpDash = Math.min(runUpDash, 25);

  upgradeChosenThisWin = true;

  // apply dash cooldown immediately
  dashCooldownMax = Math.max(0.6, 3.0 - runUpDash * 0.12);

  // continue directly to next level
  hideUpgradesBox();
  hideOverlay();
  hideStatsBox();

  level++;
  configureLevel();

  running = true;
  btnStart.textContent = "Pause";
  setRunningUI(true);

  lastFrame = 0;
  bubbleLoop();
  swimmersLoop();
  requestAnimationFrame(frame);
}

// bind reroll
if (btnReroll){
  btnReroll.addEventListener("click", doReroll);
}

if (btnSkipUpgrade){
  btnSkipUpgrade.addEventListener("click", () => {
    // évite double clic
    if (upgradeChosenThisWin) return;
    upgradeChosenThisWin = true;

    // ferme l'écran upgrades
    hideUpgradesBox();
    hideOverlay();
    hideStatsBox();

    // ✅ passe au niveau suivant DIRECTEMENT
    level++;
    configureLevel();

    running = true;
    btnStart.textContent = "Pause";
    setRunningUI(true);

    lastFrame = 0;
    bubbleLoop();
    swimmersLoop();
    requestAnimationFrame(frame);
  });
}

const btnAquarium = document.getElementById("btnAquarium");
const skinOverlay = document.getElementById("skinOverlay");
const btnCloseSkins = document.getElementById("btnCloseSkins");

function openAquarium(){
  if (!skinOverlay) return;

  // marque tous les skins débloqués comme "vus"
  for (const id of unlockedSkins) seenSkins.add(id);
  saveMeta();
  updateAquariumBadge();

  skinOverlay.classList.remove("hidden");
}

function closeAquarium(){
  skinOverlay?.classList.add("hidden");
}

if (btnAquarium) btnAquarium.addEventListener("click", openAquarium);
if (btnCloseSkins) btnCloseSkins.addEventListener("click", closeAquarium);

// ---------- Parallax ----------
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

// ---------- Cursor follow ----------
function updateCursor(){
  const baseFollow = dashTime > 0 ? 0.42 : 0.18;
  const follow = Math.min(0.78, baseFollow + runUpSpeed * 0.015);

  const prevX = x;
  const prevY = y;

  x += (mouseX - x) * follow;
  y += (mouseY - y) * follow;

  const vx = x - prevX;
  const vy = y - prevY;

  if (!updateCursor.facing) updateCursor.facing = 1;
  if (Math.abs(vx) > 0.15) updateCursor.facing = vx >= 0 ? -1 : 1;

  const tilt = Math.max(-12, Math.min(12, -vy * 1.2));
  cursorFish.style.transform =
    `translate(-50%, -50%) translate(${x}px, ${y}px) scaleX(${updateCursor.facing}) rotate(${tilt}deg)`;
}

// ---------- Entities spawn ----------
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

// ---------- Magnet ----------
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

// ---------- Eat detection ----------
function checkEat(){
  const mouthX = x + 22;
  const mouthY = y;
  const now = performance.now();

  const ents = [...entitiesEl.querySelectorAll(".entity")];

  const effectiveRadius = playerRadiusBase + Math.min(80, runUpRadius * 4);

  for (const el of ents){
    const r = el.getBoundingClientRect();
    const ex = r.left + r.width/2;
    const ey = r.top + r.height/2;
    const dist = Math.hypot(ex - mouthX, ey - mouthY);

    if (dist < effectiveRadius){
      const kind = el.dataset.kind;
      el.remove();

      if (kind === "food"){
        if (now - lastEatAt <= comboWindowMs) combo = Math.min(10, combo + 1);
        else combo = 1;
        lastEatAt = now;

        const gained = combo;
        score += gained;
        totalScore += gained;

        eatenFood++;
        maxCombo = Math.max(maxCombo, combo);

        runXP += 1;
        addMetaXP(1); // chaque nourriture donne un peu d'XP meta
        playMiam();

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
        runXP += 2;
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

// ---------- Boss init + follow ----------
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

  // boss size (match your CSS)
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

  // bounds
  const pad = 40;
  bossX = Math.max(-200, Math.min(window.innerWidth - pad, bossX));
  bossY = Math.max(-200, Math.min(window.innerHeight - pad, bossY));

  bossEl.style.left = `${bossX}px`;
  bossEl.style.top  = `${bossY}px`;

  // collision
  const now = performance.now();
  const cdx = bossCenterX - x;
  const cdy = bossCenterY - y;
  const cdist = Math.hypot(cdx, cdy);

  if (cdist < bossRadius + playerRadiusBase * 0.6 && now - lastBossHitAt > 650){
    lastBossHitAt = now;

    bossHits++;
    combo = 1;
    timeLeft = Math.max(0, timeLeft - (5.5 + level * 0.4));
    playOuch();
    syncHUD();
  }
}

// ---------- Confetti bubbles burst ----------
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

// ---------- Swimmers ----------
function createSwimmer(){
  const el = document.createElement("div");
  el.className = "swimmer";

  const fromLeft = Math.random() > 0.5;
  const yy = 80 + Math.random() * (window.innerHeight - 160);
  const dur = (10 + Math.random() * 8) / (0.9 + speed * 0.25);

  el.style.top = `${yy}px`;
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

// ---------- Bubble loop ----------
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

// ---------- Configure level ----------
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

  // apply dash upgrade (soft cap)
  dashCooldownMax = Math.max(0.6, 3.0 - runUpDash * 0.12);

  entitiesEl.innerHTML = "";
  spawnFood(40 + level * 2);

  if (level >= 2) spawnBonus();
  if (level >= 3) spawnMalus();
  if (level >= 5) spawnPowerUp();

  initBoss();
  syncHUD();
}

// ---------- Dash ----------
function tryDash(){
  if (!running) return;
  if (dashCooldown > 0) return;

  dashTime = dashTimeMax;
  dashCooldown = dashCooldownMax;

  playDash();
  syncHUD();
}

// ---------- Win / Lose ----------
function winLevel(){
  running = false;
  btnStart.textContent = "Reprendre";
  hideStatsBox();

  spawnConfettiBubblesBurst(46);
  addMetaXP(15); // récompense de victoire (ajuste si tu veux)


  // ✅ reset état upgrade pour cette manche
  upgradeChosenThisWin = false;

  // ✅ on bloque "Continuer" tant qu’aucun choix n’est fait
  if (btnNext) btnNext.disabled = true;

  showOverlay(
    `Niveau ${level} réussi ✅`,
    `Choisis un upgrade (ou reroll)`,
    "win"
  );

  // ✅ affiche le menu d’upgrades
  showUpgradesBox();
  hideOverlayActions();
  renderOffers();
}


function loseLevel(){
  running = false;
  resetRunProgress();

  btnStart.textContent = "Reprendre";
  showStatsBox();
  renderStats();

  showOverlay(
    `Fin de run ❌`,
    `Temps écoulé. Tu as atteint le niveau ${level}.`,
    "lose"
  );
}

// ---------- Random spawns ----------
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

// ---------- Main loop ----------
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

// ---------- Controls ----------
window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  tryDash();
});

window.addEventListener("pointermove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
}, { passive: true });

const btnDashMobile = document.getElementById("btnDashMobile");
if (btnDashMobile){
  btnDashMobile.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    tryDash();
  });
}

window.addEventListener("keydown", async (e) => {
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

// ---------- Start from overlay ----------
async function startGameFromOverlay(){
  // start new run
  resetRunProgress();

  hideRules();
  hideOverlay();
  hideStatsBox();
  hideUpgradesBox();

  running = true;
  btnStart.textContent = "Pause";
  setRunningUI(true);

  if (soundToggle?.checked){
    const ctx = ensureAudio();
    if (ctx && ctx.state === "suspended") await ctx.resume();
  }

  lastFrame = 0;
  bubbleLoop();
  swimmersLoop();
  requestAnimationFrame(frame);
}

// ---------- Buttons ----------
if (btnPlay){
  btnPlay.addEventListener("click", () => startGameFromOverlay());
}

btnStart.addEventListener("click", async () => {
  if (!running){
    // start new run
    resetRunProgress();

    hideRules();
    hideOverlay();
    hideStatsBox();
    hideUpgradesBox();

    running = true;
    btnStart.textContent = "Pause";
    setRunningUI(true);

    if (soundToggle?.checked){
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

  resetRunProgress();
  configureLevel();
  hideOverlay();
  hideStatsBox();

  running = false;
  btnStart.textContent = "Démarrer";
  setRunningUI(false);

  showRules();
});

btnRetry.addEventListener("click", () => {
  // recommencer / rejouer = retour menu rules
  level = 1;
  totalScore = 0;

  eatenFood = 0;
  takenBonus = 0;
  takenMalus = 0;
  takenPower = 0;
  bossHits = 0;
  maxCombo = 1;

  resetRunProgress();
  configureLevel();
  hideOverlay();
  hideStatsBox();

  running = false;
  btnStart.textContent = "Démarrer";
  setRunningUI(false);
  syncHUD();

  showRules();
});

// ---------- Init ----------
bestEl.textContent = bestScore;

configureLevel();
syncHUD();
setRunningUI(false);
showRules();
applyEquippedSkins();
renderMetaBar();


