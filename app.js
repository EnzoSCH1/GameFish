// =========================
// Sea Fish Game - app.js
// (4 upgrades random + rarity + reroll progressive)
// XP + upgrades = RUN ONLY (reset on lose)
// =========================

import { saveToCloud, loadFromCloud, getUserId, submitScore, getLeaderboard, getUsername, setUsername, saveUsernameToCloud, reserveUsername } from './firebase.js';

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
const btnDashMobile = document.getElementById("btnDashMobile");
const topLeaderboard = document.getElementById("topLeaderboard");
const topLeaderboardList = document.getElementById("topLeaderboardList");
let currentLeaderboardMode = 'normal';

const soundToggle = document.getElementById("soundToggle");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMsg = document.getElementById("overlayMsg");
const rulesBox = document.getElementById("rules");
const statsBox = document.getElementById("stats");
const actionsEl = overlay ? overlay.querySelector(".actions") : null;

const tutorialOverlay = document.getElementById("tutorialOverlay");
const tutorialTitle = document.getElementById("tutorialTitle");
const tutorialMsg = document.getElementById("tutorialMsg");
const btnTutorialNext = document.getElementById("btnTutorialNext");
const btnSkipTutorial = document.getElementById("btnSkipTutorial");
const tutorialHand = document.getElementById("tutorialHand");

// Mode buttons
const btnNormal = document.getElementById("btnNormal");
const btnEndless = document.getElementById("btnEndless");
const btnTimeAttack = document.getElementById("btnTimeAttack");

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

// Health display
const healthEl = document.getElementById("health");
const healthDisplay = document.getElementById("healthDisplay");

// Blood overlay
const bloodLayer = document.getElementById("bloodLayer");

function createBloodDrops(count = 18){
  if (!bloodLayer) return;
  bloodLayer.innerHTML = "";

  for (let i = 0; i < count; i++){
    const drop = document.createElement("div");
    drop.className = "blood-drop";

    const x = Math.random() * 100;
    const w = 12 + Math.random() * 18;
    const h = 28 + Math.random() * 38;
    const duration = 2.6 + Math.random() * 2.6;
    const delay = -Math.random() * duration;

    drop.style.setProperty("--x", `${x}vw`);
    drop.style.setProperty("--w", `${w}px`);
    drop.style.setProperty("--h", `${h}px`);
    drop.style.setProperty("--duration", `${duration}s`);
    drop.style.setProperty("--delay", `${delay}s`);

    bloodLayer.appendChild(drop);
  }
}

function enableBloodDrops(){
  if (!bloodLayer) return;
  if (!bloodLayer.children.length) createBloodDrops();
  bloodLayer.classList.remove("hidden");
}

function disableBloodDrops(){
  if (!bloodLayer) return;
  bloodLayer.classList.add("hidden");
  bloodLayer.innerHTML = "";
}

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

// ---------- GAME OPTIONS (persistent) ----------
const LS_BOSS_SPEED = "sea_boss_speed_mul";
const LS_TIME_MUL = "sea_time_multiplier";
const LS_PARALLAX_ON = "sea_parallax_enabled";
const LS_CAUSTICS_ON = "sea_caustics_enabled";
const LS_SWIMMERS_ON = "sea_swimmers_enabled";

let bossSpeedMultiplier = Number(localStorage.getItem(LS_BOSS_SPEED) || "1.0");
let timeMultiplier = Number(localStorage.getItem(LS_TIME_MUL) || "1.0");
let parallaxEnabled = localStorage.getItem(LS_PARALLAX_ON) !== "false";
let causticsEnabled = localStorage.getItem(LS_CAUSTICS_ON) !== "false";
let swimmersEnabled = localStorage.getItem(LS_SWIMMERS_ON) !== "false";

function saveGameOptions(){
  localStorage.setItem(LS_BOSS_SPEED, String(bossSpeedMultiplier));
  localStorage.setItem(LS_TIME_MUL, String(timeMultiplier));
  localStorage.setItem(LS_PARALLAX_ON, String(parallaxEnabled));
  localStorage.setItem(LS_CAUSTICS_ON, String(causticsEnabled));
  localStorage.setItem(LS_SWIMMERS_ON, String(swimmersEnabled));
  applyVisualOptions();
}

function applyVisualOptions(){
  const layers = [...document.querySelectorAll(".layer")];
  layers.forEach(l => l.style.opacity = parallaxEnabled ? "1" : "0");
  
  const caustics = document.getElementById("caustics");
  if (caustics) caustics.style.display = causticsEnabled ? "block" : "none";
  
  const swimmers = document.getElementById("swimmers");
  if (swimmers) swimmers.style.display = swimmersEnabled ? "block" : "none";
}

// Enemy
const enemyRadius = 35;
const enemySpeed = 80;
const enemySlowDuration = 2.0; // secondes de ralentissement

// Game modes
const GAME_MODES = {
  normal: 'normal',
  endless: 'endless',
  timeAttack: 'time_attack'
};

// =========================
// META XP + SKINS (persistant)
// =========================
const LS_META_XP = "sea_meta_xp";
const LS_META_MAX = "sea_meta_xp_max";
const LS_TOTAL_XP = "sea_total_xp"; // XP total pour la boutique (ne diminue jamais sauf achat)
const LS_UNLOCKED_SKINS = "sea_unlocked_skins";
const LS_SEEN_SKINS = "sea_seen_skins";
const LS_EQUIP_CURSOR = "sea_equip_cursor";
const LS_EQUIP_BOSS = "sea_equip_boss";
const LS_FIRST_TIME = "sea_first_time";

// barre meta (reset quand elle se remplit)
let metaXP = Number(localStorage.getItem(LS_META_XP) || "0");
let metaXPMax = Number(localStorage.getItem(LS_META_MAX) || "350"); // départ 350

// XP total accumulé (monnaie pour la boutique, ne diminue que lors d'achats)
let totalXP = Number(localStorage.getItem(LS_TOTAL_XP) || "0");

// inventaire
let unlockedSkins = new Set(JSON.parse(localStorage.getItem(LS_UNLOCKED_SKINS) || "[]"));
let seenSkins = new Set(JSON.parse(localStorage.getItem(LS_SEEN_SKINS) || "[]"));

// équipé
let equippedCursor = localStorage.getItem(LS_EQUIP_CURSOR) || "cursor_base";
let equippedBoss = localStorage.getItem(LS_EQUIP_BOSS) || "boss_base";

let isFirstTime = !localStorage.getItem(LS_FIRST_TIME);
let tutorialStep = 0;
let tutorialMode = false;
let tutorialCanEat = false;
let tutorialCanDash = false;

// Charger depuis le cloud si disponible
async function loadCloudData() {
  const userId = getUserId();
  const cloudData = await loadFromCloud(userId);
  if (cloudData) {
    metaXP = cloudData.metaXP || metaXP;
    metaXPMax = cloudData.metaXPMax || metaXPMax;
    totalXP = cloudData.totalXP || totalXP;
    unlockedSkins = new Set(cloudData.unlockedSkins || []);
    seenSkins = new Set(cloudData.seenSkins || []);
    equippedCursor = cloudData.equippedCursor || equippedCursor;
    equippedBoss = cloudData.equippedBoss || equippedBoss;
    bestScore = cloudData.bestScore || bestScore;
    // Mettre à jour localStorage
    localStorage.setItem(LS_META_XP, String(metaXP));
    localStorage.setItem(LS_META_MAX, String(metaXPMax));
    localStorage.setItem(LS_TOTAL_XP, String(totalXP));
    localStorage.setItem(LS_UNLOCKED_SKINS, JSON.stringify([...unlockedSkins]));
    localStorage.setItem(LS_SEEN_SKINS, JSON.stringify([...seenSkins]));
    localStorage.setItem(LS_EQUIP_CURSOR, equippedCursor);
    localStorage.setItem(LS_EQUIP_BOSS, equippedBoss);
    localStorage.setItem(LS_BEST, String(bestScore));
    console.log('Données chargées depuis le cloud');

    if (cloudData.usernameError === 'duplicate') {
      localStorage.removeItem('username');
      showUsernameModal('Ce nom est déjà utilisé par un autre joueur. Merci d\'en choisir un nouveau pour continuer.');
    }
  }
}
loadCloudData();

async function syncUsernameToCloudIfMissing(){
  const username = getUsername();
  if (!username) return;
  const userId = getUserId();
  const cloudData = await loadFromCloud(userId);
  if (!cloudData || !cloudData.username) {
    await saveUsernameToCloud(userId, username);
  }
}
syncUsernameToCloudIfMissing();

// placeholders (tu remplaceras src plus tard par tes vraies images)
const CURSOR_SKINS = [
  { id:"cursor_base", name:"Classique", rarity:"common", src:"assets/fish/skins/cursor.png" },
  { id:"cursor_1", name:"Guppy", rarity:"common", oneIn: 15,   src:"assets/fish/skins/cursor1.png" },
  { id:"cursor_2", name:"Poisson-rouge", rarity:"common", oneIn: 15, src:"assets/fish/skins/cursor2.png" },
  { id:"cursor_3", name:"Sardine", rarity:"common", oneIn: 15,  src:"assets/fish/skins/cursor3.png" },
  { id:"cursor_4", name:"Poisson-volant", rarity:"common", oneIn: 15, src:"assets/fish/skins/cursor4.png" },
  { id:"cursor_5", name:"Poisson-ange", rarity:"rare", oneIn: 25, src:"assets/fish/skins/cursor5.png" },
  { id:"cursor_6", name:"Poisson-globe", rarity:"rare", oneIn: 25, src:"assets/fish/skins/cursor6.png" },
  { id:"cursor_7", name:"Baliste", rarity:"rare", oneIn: 25, src:"assets/fish/skins/cursor7.png" },
  { id:"cursor_8", name:"Poisson-lune", rarity:"epic", oneIn: 300, src:"assets/fish/skins/cursor8.png" },
  { id:"cursor_9", name:"Poisson-lion", rarity:"epic", oneIn: 300, src:"assets/fish/skins/cursor9.png" },
  { id:"cursor_10", name:"Poisson-translucide", rarity:"legendary", oneIn: 650, src:"assets/fish/skins/cursor10.png" },
  { id:"cursor_11", name:"Poisson-papier", rarity:"legendary", oneIn: 650, src:"assets/fish/skins/cursor11.png" },
];

const BOSS_SKINS = [
  { id:"boss_base", name:"Classique", rarity:"common", src:"assets/fish/skins/boss.png" },
  { id:"boss_1", name:"Requin-blanc", rarity:"common",  oneIn: 25, src:"assets/fish/skins/boss1.png" },
  { id:"boss_2", name:"Requin baleine", rarity:"rare", oneIn: 55, src:"assets/fish/skins/boss2.png" },
  { id:"boss_3", name:"Mégalodon", rarity:"epic", oneIn: 350, src:"assets/fish/skins/boss3.png" },
  { id:"boss_4", name:"Apex", rarity:"epic", oneIn: 350, src:"assets/fish/skins/boss4.png" },
  { id:"boss_5", name:"Livyatan", rarity:"legendary", oneIn: 600, src:"assets/fish/skins/boss5.png" },
  { id:"boss_6", name:"Mosasaure", rarity:"legendary", oneIn: 600, src:"assets/fish/skins/boss6.png" },
];

function saveMeta(){
  localStorage.setItem(LS_META_XP, String(metaXP));
  localStorage.setItem(LS_META_MAX, String(metaXPMax));
  localStorage.setItem(LS_TOTAL_XP, String(totalXP));
  localStorage.setItem(LS_UNLOCKED_SKINS, JSON.stringify([...unlockedSkins]));
  localStorage.setItem(LS_SEEN_SKINS, JSON.stringify([...seenSkins]));
  localStorage.setItem(LS_EQUIP_CURSOR, equippedCursor);
  localStorage.setItem(LS_EQUIP_BOSS, equippedBoss);

  // Sauvegarde cloud
  const userId = getUserId();
  const data = {
    metaXP,
    metaXPMax,
    totalXP,
    unlockedSkins: [...unlockedSkins],
    seenSkins: [...seenSkins],
    equippedCursor,
    equippedBoss,
    bestScore
  };
  saveToCloud(userId, data);
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
  const pool = [...CURSOR_SKINS, ...BOSS_SKINS].filter(s =>s.oneIn && !unlockedSkins.has(s.id));
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
  totalXP += amount; // Ajouter aussi au total qui ne se reset jamais

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
  renderTabBadges();
  updateAquariumBadge();
}

// =========================
// SHOP (metaXP currency)
// =========================
const btnShop = document.getElementById("btnShop");
const shopOverlay = document.getElementById("shopOverlay");
const btnCloseShop = document.getElementById("btnCloseShop");
const shopGrid = document.getElementById("shopGrid");
const metaXPShop = document.getElementById("metaXPShop");

const shopTabCursor = document.getElementById("shopTabCursor");
const shopTabBoss = document.getElementById("shopTabBoss");

let shopMode = "cursor"; // cursor | boss

function openShop(){
  if (!shopOverlay) return;
  shopOverlay.classList.remove("hidden");
  renderShop();
}

function closeShop(){
  shopOverlay?.classList.add("hidden");
}

function getSkinPrice(skin){
  // prix simple par rareté
  const table = {
    common:  150,
    rare:    500,
    epic:   1500,
    legendary: 5000,
  };
  return table[skin.rarity] || 260;
}

function isUnlocked(id){
  return unlockedSkins.has(id);
}

function renderShop(){
  if (!shopGrid) return;

  if (metaXPShop) metaXPShop.textContent = String(totalXP); // Utiliser totalXP pour l'affichage

  const list = shopMode === "cursor" ? CURSOR_SKINS : BOSS_SKINS;

  shopGrid.innerHTML = "";

  for (const skin of list){
    // on ne vend pas les bases (toujours dispo)
    if (skin.id === "cursor_base" || skin.id === "boss_base") continue;

    const card = document.createElement("div");
    card.className = `shop-card r-${skin.rarity}`;

    const preview = document.createElement("div");
    preview.className = "preview";
    preview.style.backgroundImage = `url("${skin.src}")`;

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = skin.name;

    const rarity = document.createElement("div");
    rarity.className = "rarity";
    rarity.textContent = `Rareté: ${skin.rarity}`;

    const priceVal = getSkinPrice(skin);
    const price = document.createElement("div");
    price.className = "price";
    price.textContent = `Prix: ${priceVal} metaXP`;

    const btn = document.createElement("button");

    if (!isUnlocked(skin.id)){
      btn.textContent = "Acheter";
      btn.disabled = totalXP < priceVal; // Vérifier avec totalXP
      btn.onclick = () => {
        if (totalXP < priceVal) return; // Vérifier avec totalXP
        totalXP -= priceVal; // Déduire de totalXP
        unlockedSkins.add(skin.id);
        saveMeta();
        renderMetaBar();
        renderTabBadges();
        updateAquariumBadge();
        renderShop();
      };
    } else {
      btn.textContent = "Équiper";
      btn.disabled = false;
      btn.onclick = () => {
        if (shopMode === "cursor") equippedCursor = skin.id;
        else equippedBoss = skin.id;

        saveMeta();
        applyEquippedSkins();
        renderShop();
      };
    }

    card.appendChild(preview);
    card.appendChild(name);
    card.appendChild(rarity);
    card.appendChild(price);
    card.appendChild(btn);

    shopGrid.appendChild(card);
  }
}

if (btnShop) btnShop.addEventListener("click", openShop);
if (btnCloseShop) btnCloseShop.addEventListener("click", closeShop);

if (shopTabCursor){
  shopTabCursor.addEventListener("click", () => {
    shopMode = "cursor";
    shopTabCursor.classList.add("active");
    shopTabBoss?.classList.remove("active");
    renderShop();
  });
}
if (shopTabBoss){
  shopTabBoss.addEventListener("click", () => {
    shopMode = "boss";
    shopTabBoss.classList.add("active");
    shopTabCursor?.classList.remove("active");
    renderShop();
  });
}

// ---------- Mode selection ----------
function setGameMode(mode) {
  gameMode = mode;
  // Update button active state
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  if (mode === GAME_MODES.normal) btnNormal?.classList.add('active');
  else if (mode === GAME_MODES.endless) btnEndless?.classList.add('active');
  else if (mode === GAME_MODES.timeAttack) btnTimeAttack?.classList.add('active');
  
  // Update top leaderboard
  updateTopLeaderboard(mode);
}

// Mode selection
if (btnNormal) btnNormal.addEventListener("click", () => setGameMode(GAME_MODES.normal));
if (btnEndless) btnEndless.addEventListener("click", () => setGameMode(GAME_MODES.endless));
if (btnTimeAttack) btnTimeAttack.addEventListener("click", () => setGameMode(GAME_MODES.timeAttack));

// ---------- Initialize game for mode ----------
function initializeGameForMode() {
  if (gameMode === GAME_MODES.timeAttack) {
    timeLeft = 60; // 60 seconds for time attack
    level = 1;
    score = 0;
    target = 15;
    health = maxHealth; // not used
  } else if (gameMode === GAME_MODES.endless) {
    timeLeft = 9999; // effectively infinite
    level = 1;
    score = 0;
    target = 150; // affichage visuel pour les upgrades
    health = maxHealth;
    endlessUpgradeCounter = 0; // reset upgrade counter
  } else { // normal
    timeLeft = 30;
    level = 1;
    score = 0;
    target = 15;
    health = maxHealth; // not used
  }
  totalScore = 0;
  combo = 1;
  eatenFood = 0;
  takenBonus = 0;
  takenMalus = 0;
  takenPower = 0;
  bossHits = 0;
  maxCombo = 1;
  
  // Configure level and init boss
  configureLevel();
  initBoss();
  
  syncHUD();
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
let wasRunningBeforeHide = false;
let wasRunningBeforeOptions = false;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const inputModeParams = new URLSearchParams(window.location.search);
const forceMobile = ["1", "true", "yes"].includes((inputModeParams.get("mobile") || "").toLowerCase());
const forceDesktop = ["1", "true", "yes"].includes((inputModeParams.get("desktop") || "").toLowerCase());

function detectCoarsePointer(){
  if (forceDesktop) return false;
  if (forceMobile) return true;
  const coarse = window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(any-pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches || window.matchMedia("(any-hover: none)").matches;
  const touch = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) <= 900;
  return coarse || (touch && (noHover || smallScreen));
}

let isCoarsePointer = detectCoarsePointer();
document.body.classList.toggle("mobile-mode", isCoarsePointer);

function updateMobileOrientationClass(){
  const isLandscape = window.innerWidth > window.innerHeight;
  document.body.classList.toggle("mobile-landscape", isCoarsePointer && isLandscape);
  document.body.classList.toggle("mobile-portrait", isCoarsePointer && !isLandscape);
}

function syncMobileControls(){
  if (!btnDashMobile) return;
  if (isCoarsePointer) btnDashMobile.classList.remove("hidden");
  else btnDashMobile.classList.add("hidden");
}

function refreshInputMode(){
  const next = detectCoarsePointer();
  if (next !== isCoarsePointer){
    isCoarsePointer = next;
    document.body.classList.toggle("mobile-mode", isCoarsePointer);
    syncMobileControls();
    setJoystickVisibility(running);
  }
  updateMobileOrientationClass();
}

window.addEventListener("resize", refreshInputMode);
window.addEventListener("orientationchange", refreshInputMode);
updateMobileOrientationClass();
syncMobileControls();

document.addEventListener("visibilitychange", () => {
  if (document.hidden){
    if (running){
      wasRunningBeforeHide = true;
      running = false;
      setRunningUI(false);
      setJoystickVisibility(false);
    }
  } else if (wasRunningBeforeHide){
    wasRunningBeforeHide = false;
    running = true;
    setRunningUI(true);
    setJoystickVisibility(true);
    btnStart.textContent = "Pause";
    lastFrame = 0;
    bubbleLoop();
    swimmersLoop();
    requestAnimationFrame(frame);
  }
});

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

// Game mode
let gameMode = GAME_MODES.normal;

// Health for endless mode
let health = 100;
const maxHealth = 100;

// Endless mode upgrades
let endlessUpgradeCounter = 0; // Compte les nourritures pour les upgrades
const ENDLESS_UPGRADE_INTERVAL = 150; // Upgrade tous les 150 nourritures

// Random events
let currentEvent = null;
let eventTimer = 0;
const EVENT_INTERVAL = 15; // seconds between potential events
const EVENT_DURATION = 8; // seconds
let currentVX = 0; // courant marin X (DEPRECATED)
let currentVY = 0; // courant marin Y (DEPRECATED)
let tideOffset = 0; // marée offset
let tideDirection = 1; // marée direction (1 ou -1)
let planktonActive = false; // plancton lumineux actif
let bossSpeedBoost = 1.0; // multiplicateur de vitesse du boss pour soif de sang

// Power-up state
let dashCooldown = 0;
let dashCooldownMax = 3.0;
let dashTime = 0;

let magnetTime = 0;

// Slow effect from enemy
let slowTime = 0;

// Boss movement state
let bossActive = false;
let bossX = -9999, bossY = -9999;
let bossSpeed = 200;
let bossVX = 0, bossVY = 0;
let bossMaxAccel = 550;
let lastBossHitAt = 0;

// Enemy state
let enemies = []; // array of {x, y, vx, vy, el}

// Boss invisibility state
let bossInvisible = false;

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
  
  // Arrêter la tempête si elle est en cours
  if (currentEvent === 'storm') {
    document.body.classList.remove('storm');
    currentEvent = null;
    eventTimer = EVENT_INTERVAL + Math.random() * 10;
  }
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

  // Clear enemies
  for (const enemy of enemies) enemy.el.remove();
  enemies = [];
  slowTime = 0;

  // Reset event - remove ALL event classes
  currentEvent = null;
  eventTimer = 0;
  bossInvisible = false;
  document.body.classList.remove('storm', 'bloodlust', 'tide', 'plankton', 'murky', 'attack-surprise');
  
  // Remove damage flash overlay
  const damageFlash = document.getElementById("damageFlash");
  if (damageFlash) {
    damageFlash.classList.remove("active");
  }

  hideUpgradesBox();
  updateRerollButton();
  renderOffers(); // safe even if no offers
}

// ---------- Stats Render ----------
function renderStats(){
  if (!statsBox) return;
  stTotal.textContent = totalScore;
  // Show high score for current mode
  let highScore = bestScore; // default
  if (gameMode === GAME_MODES.timeAttack) {
    highScore = parseInt(localStorage.getItem('highscore_timeAttack') || '0');
  } else if (gameMode === GAME_MODES.endless) {
    highScore = parseInt(localStorage.getItem('highscore_endless') || '0');
  }
  stBest.textContent = highScore;
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
  
  // En mode endless, afficher le compteur de nourritures pour l'upgrade
  if (gameMode === GAME_MODES.endless) {
    scoreEl.textContent = endlessUpgradeCounter;
    targetEl.textContent = ENDLESS_UPGRADE_INTERVAL;
  } else {
    scoreEl.textContent = score;
    targetEl.textContent = target;
  }
  
  timeEl.textContent = timeLeft.toFixed(1);
  comboEl.textContent = `x${combo}`;

  totalEl.textContent = totalScore;
  bestEl.textContent = bestScore;

  // Health display for endless mode
  if (gameMode === GAME_MODES.endless) {
    healthEl.textContent = health;
    healthDisplay.style.display = 'block';
    // Update health bar
    const healthBar = document.getElementById('healthBar');
    if (healthBar) {
      const healthPercent = (health / maxHealth) * 100;
      healthBar.style.width = healthPercent + '%';
    }
  } else {
    healthDisplay.style.display = 'none';
  }

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
  setJoystickVisibility(false);
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
    overlay.classList.remove("lose");
    // prepare offers + reroll
    upgradeChosenThisWin = false;
    rerollCount = 0;
    
    closeShop();
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
    overlay.classList.add("lose");
    btnNext.style.display = "none";
    btnRetry.style.display = "inline-block";
    btnRetry.textContent = "Rejouer";
    
    closeShop();
    hideUpgradesBox();
    showOverlayActions();

    // ✅ on s'assure que "Passer" reste caché
    if (btnSkipUpgrade) btnSkipUpgrade.classList.add("hidden");
  }

  setRunningUI(false);
  setJoystickVisibility(false);
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

  // En mode endless, on ne monte pas de niveau
  if (gameMode !== GAME_MODES.endless) {
    level++;
  }
  configureLevel();

  running = true;
  btnStart.textContent = "Pause";
  setRunningUI(true);
  setJoystickVisibility(true);

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

    // ✅ passe au niveau suivant DIRECTEMENT (sauf en endless)
    if (gameMode !== GAME_MODES.endless) {
      level++;
    }
    configureLevel();

    running = true;
    btnStart.textContent = "Pause";
    setRunningUI(true);
    setJoystickVisibility(true);
    setJoystickVisibility(true);

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

  renderTabBadges();       // met les petits badges sur Poisson/Boss
  renderSkinGrid();        // affiche les cartes
  updateAquariumBadge();   // badge global (si tu le gardes)

  skinOverlay.classList.remove("hidden");
}


// ===== INVENTAIRE SKINS (Aquarium) =====
const tabCursor = document.getElementById("tabCursor");
const tabBoss = document.getElementById("tabBoss");
const skinGrid = document.getElementById("skinGrid");

let skinMode = "cursor"; // "cursor" | "boss"

function isSkinUnlocked(id){
  // les bases sont toujours disponibles
  if (id === "cursor_base" || id === "boss_base") return true;
  return unlockedSkins.has(id);
}

function getEquippedId(){
  return skinMode === "cursor" ? equippedCursor : equippedBoss;
}

function setEquippedId(id){
  if (skinMode === "cursor") equippedCursor = id;
  else equippedBoss = id;

  saveMeta();
  applyEquippedSkins();
  renderSkinGrid();
}

function renderSkinGrid(){
  if (!skinGrid) return;

  const list = skinMode === "cursor" ? CURSOR_SKINS : BOSS_SKINS;
  const equippedId = getEquippedId();

  skinGrid.innerHTML = "";

  for (const skin of list){
    const unlocked = isSkinUnlocked(skin.id);

   const card = document.createElement("div");
  card.className = `skin-card r-${skin.rarity}` + (unlocked ? "" : " locked");

  // NEW badge si débloqué mais pas vu (hors skins de base)
  const isBase = skin.id === "cursor_base" || skin.id === "boss_base";
  if (!isBase && unlocked && !seenSkins.has(skin.id)) {
    const nb = document.createElement("div");
    nb.className = "new-badge";
    nb.textContent = "NEW";
    card.appendChild(nb);
  }
  const preview = document.createElement("div");
  preview.className = "skin-preview";
  preview.style.backgroundImage = `url("${skin.src}")`;

  const name = document.createElement("div");
  name.className = "skin-name";
  name.textContent = skin.name;

  const rarity = document.createElement("div");
  rarity.className = "skin-rarity";
  rarity.textContent = `Rareté: ${skin.rarity}`;

  const actions = document.createElement("div");
  actions.className = "skin-actions";

  const btn = document.createElement("button");

  if (!unlocked) {
  btn.textContent = "Verrouillé";
  btn.disabled = true;
  } else if (skin.id === equippedId) {
  btn.textContent = "Équipé ✅";
  btn.disabled = true;
  } else {
  btn.textContent = "Équiper";
  btn.onclick = () => {
    markSkinSeen(skin.id);
    setEquippedId(skin.id);
  };
  }

  actions.appendChild(btn);

  card.appendChild(preview);
  card.appendChild(name);
  card.appendChild(rarity);
  card.appendChild(actions);

  // Click anywhere on card marks skin as seen
  card.addEventListener('click', () => {
    markSkinSeen(skin.id);
  });

  skinGrid.appendChild(card);

  }
}

function markSkinSeen(id){
  if (!seenSkins.has(id)){
    seenSkins.add(id);
    saveMeta();
    renderTabBadges();
    renderSkinGrid();
    updateAquariumBadge();
  }
}

function isCursorSkin(id){
  return CURSOR_SKINS.some(s => s.id === id);
}
function isBossSkin(id){
  return BOSS_SKINS.some(s => s.id === id);
}

function getNewCountFor(type){
  let count = 0;
  for (const id of unlockedSkins){
    if (seenSkins.has(id)) continue;

    if (type === "cursor" && isCursorSkin(id)) count++;
    if (type === "boss" && isBossSkin(id)) count++;
  }
  return count;
}

function renderTabBadges(){
  const newCursor = getNewCountFor("cursor");
  const newBoss = getNewCountFor("boss");

  if (tabCursor){
    tabCursor.innerHTML = `Poisson${newCursor > 0 ? ` <span class="tab-badge">${newCursor}</span>` : ""}`;
  }
  if (tabBoss){
    tabBoss.innerHTML = `Boss${newBoss > 0 ? ` <span class="tab-badge">${newBoss}</span>` : ""}`;
  }
}

// Onglets inventaire
if (tabCursor){
  tabCursor.addEventListener("click", () => {
    skinMode = "cursor";
    tabCursor.classList.add("active");
    tabBoss?.classList.remove("active");

  renderTabBadges();
  renderSkinGrid();
  });
}
if (tabBoss){
  tabBoss.addEventListener("click", () => {
    skinMode = "boss";
    tabBoss.classList.add("active");
    tabCursor?.classList.remove("active");

  renderTabBadges();
  renderSkinGrid();
  });
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
    let py = -dy * 40 * depth * 10;
    
    // Appliquer l'effet de marée
    if (currentEvent === 'tide') {
      py += tideOffset * depth * 50;
    }
    
    layer.style.transform = `translate3d(${px}px, ${py}px, 0)`;
  });
}

// ---------- Cursor follow ----------
function updateCursor(){
  const baseFollow = dashTime > 0 ? 0.42 : 0.18;
  let follow = Math.min(0.78, baseFollow + runUpSpeed * 0.015);

  // Apply slow effect
  if (slowTime > 0) follow *= 0.5; // half speed

  const prevX = x;
  const prevY = y;

  const joystickRange = Math.max(120, Math.min(220, Math.min(window.innerWidth, window.innerHeight) * 0.32));
  const targetX = joystickActive ? (window.innerWidth / 2 + joystickX * joystickRange) : mouseX;
  const targetY = joystickActive ? (window.innerHeight / 2 + joystickY * joystickRange) : mouseY;

  x += (targetX - x) * follow;
  y += (targetY - y) * follow;

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

function spawnEnemy(){
  const pad = 50;
  const ex = Math.random() * (window.innerWidth - pad*2) + pad;
  const ey = Math.random() * (window.innerHeight - pad*2) + pad;
  const el = createEntity("enemy", ex, ey);
  const enemy = { x: ex, y: ey, vx: 0, vy: 0, el };
  enemies.push(enemy);
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

// ---------- Tide effect on entities ----------
function applyTideEffect(){
  if (currentEvent !== 'tide') return;

  const entities = [...entitiesEl.querySelectorAll(".entity")];
  for (const el of entities) {
    const baseTop = Number(el.dataset.baseTop || el.style.top.replace('px', ''));
    if (!el.dataset.baseTop) {
      el.dataset.baseTop = baseTop;
    }
    
    // Appliquer un mouvement vertical fort basé sur l'offset de marée
    const offset = tideOffset * 80; // Multiplier pour un effet plus important
    el.style.top = `${baseTop + offset}px`;
  }
}

// Dans applyMagnet, avant la fin de la fonction:
// (note: le code qui suit existait déjà)

// ---------- Eat detection ----------
function checkEat(){
  if (tutorialMode && !tutorialCanEat) return;

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

        let gained = combo;
        // Plancton lumineux double les points
        if (planktonActive) {
          gained *= 2;
        }
        score += gained;
        totalScore += gained;

        eatenFood++;
        maxCombo = Math.max(maxCombo, combo);

        runXP += 1;
        addMetaXP(1); // chaque nourriture donne un peu d'XP meta
        playMiam();
        spawnParticles(ex, ey, 'bubble', 3);

        if (totalScore > bestScore){
          bestScore = totalScore;
          localStorage.setItem(LS_BEST, String(bestScore));
        }

        // En mode endless: upgrade tous les 150 nourritures
        if (gameMode === GAME_MODES.endless) {
          endlessUpgradeCounter++;
          if (endlessUpgradeCounter >= ENDLESS_UPGRADE_INTERVAL) {
            endlessUpgradeCounter = 0;
            winLevel();
            return;
          }
        } else {
          // Pour les autres modes: système normal score >= target
          if (score >= target){
            winLevel();
            return;
          }
        }

        const minFood = isCoarsePointer ? 7 : 10;
        const refillCount = isCoarsePointer ? 12 : 22;
        if (entitiesEl.querySelectorAll(".food").length < minFood){
          spawnFood(refillCount);
        }
        
      }

      if (kind === "bonus"){
        takenBonus++;
        runXP += 2;
        playBonus();
        spawnParticles(ex, ey, 'spark', 5);
      }

      if (kind === "malus"){
        takenMalus++;
        combo = 1;
        if (gameMode === GAME_MODES.endless) {
          health = Math.max(0, health - 20); // reduce health in endless
        } else {
          timeLeft = Math.max(0, timeLeft - (4.5 + level * 0.35));
        }
        playOuch();
        spawnParticles(ex, ey, 'bubble', 2); // or different
        triggerDamageFlash();
      }

      if (kind === "power-dash"){
        takenPower++;
        dashCooldown = Math.max(0, dashCooldown - 1.2);
        playBonus();
        spawnParticles(ex, ey, 'spark', 4);
      }

      if (kind === "power-magnet"){
        takenPower++;
        magnetTime = Math.max(magnetTime, magnetMax);
        playBonus();
        spawnParticles(ex, ey, 'spark', 4);
      }

      syncHUD();
    }
  }
}

// ---------- Boss init + follow ----------
function initBoss(){
  // Endless: boss appears immediately, Normal/TimeAttack: level >= 4
  bossActive = (gameMode === GAME_MODES.endless) || level >= 4;

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

  bossSpeed = (160 + level * 18) * bossSpeedMultiplier;
  bossMaxAccel = 520 + level * 28;

  bossEl.style.left = `${bossX}px`;
  bossEl.style.top  = `${bossY}px`;
}

function getBossSize(){
  if (!isCoarsePointer) return { w: 520, h: 292 };
  const isLandscape = window.innerWidth > window.innerHeight;
  return isLandscape ? { w: 280, h: 158 } : { w: 320, h: 180 };
}

function getBossRadius(){
  if (!isCoarsePointer) return bossRadius;
  const isLandscape = window.innerWidth > window.innerHeight;
  return isLandscape ? 70 : 78;
}

function updateBoss(dt){
  if (!bossActive) return;

  // boss size (match your CSS)
  const size = getBossSize();
  const bossW = size.w;
  const bossH = size.h;

  const bossCenterX = bossX + bossW / 2;
  const bossCenterY = bossY + bossH / 2;

  const targetX = x;
  const targetY = y;

  let dx = targetX - bossCenterX;
  let dy = targetY - bossCenterY;
  const dist = Math.hypot(dx, dy) || 1;

  dx /= dist;
  dy /= dist;

  const desiredVX = dx * bossSpeed * bossSpeedBoost; // Appliquer le boost de vitesse
  const desiredVY = dy * bossSpeed * bossSpeedBoost;

  let ax = desiredVX - bossVX;
  let ay = desiredVY - bossVY;

  const aLen = Math.hypot(ax, ay) || 1;
  
  // Augmenter l'accélération pendant le boost de sang pour rester très précis
  let maxA = bossMaxAccel * dt;
  if (currentEvent === 'bloodlust') {
    maxA *= 5; // Accélération 5x plus rapide pour suivre très précisément avec le boost
  }

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

  const bossHitRadius = getBossRadius();
  if (cdist < bossHitRadius + playerRadiusBase * 0.6 && now - lastBossHitAt > 650){
    lastBossHitAt = now;

    bossHits++;
    combo = 1;
    if (gameMode === GAME_MODES.endless) {
      health = Math.max(0, health - 15); // reduce health in endless
    } else {
      timeLeft = Math.max(0, timeLeft - (5.5 + level * 0.4));
    }
    playOuch();
    syncHUD();
    triggerDamageFlash();
  }
}

function updateEnemies(dt){
  for (let i = enemies.length - 1; i >= 0; i--){
    const enemy = enemies[i];
    const dx = x - enemy.x;
    const dy = y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;

    // Move towards player
    enemy.vx = (dx / dist) * enemySpeed;
    enemy.vy = (dy / dist) * enemySpeed;

    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;

    enemy.el.style.left = `${enemy.x}px`;
    enemy.el.style.top = `${enemy.y}px`;

    // Check collision with player
    if (dist < playerRadiusBase + enemyRadius){
      // Hit: slow player
      slowTime = Math.max(slowTime, enemySlowDuration);
      enemy.el.remove();
      enemies.splice(i, 1);
      playOuch(); // reuse sound
      spawnParticles(enemy.x, enemy.y, 'bubble', 3);
      triggerDamageFlash();
    }
  }
}

// ---------- Confetti bubbles burst ----------
const MAX_BUBBLES = prefersReducedMotion ? (isCoarsePointer ? 16 : 34) : (isCoarsePointer ? 28 : 60);
const MAX_SWIMMERS = prefersReducedMotion ? (isCoarsePointer ? 2 : 4) : (isCoarsePointer ? 3 : 6);
const MAX_POOL_BUBBLES = 80;
const MAX_POOL_SWIMMERS = 8;

const bubblePool = [];
const swimmerPool = [];
let activeBubbles = 0;
let activeSwimmers = 0;

function getBubbleEl(){
  let el = bubblePool.pop();
  if (!el){
    el = document.createElement("div");
    el.className = "bubble";
    el.addEventListener("animationend", () => recycleBubble(el));
  }
  return el;
}

function recycleBubble(el){
  if (el.isConnected) el.remove();
  activeBubbles = Math.max(0, activeBubbles - 1);
  if (bubblePool.length < MAX_POOL_BUBBLES) bubblePool.push(el);
}

function resetBubbleAnimation(el){
  el.style.animation = "none";
  void el.offsetHeight;
  el.style.animation = "";
}

function getSwimmerEl(){
  let el = swimmerPool.pop();
  if (!el){
    el = document.createElement("div");
    el.className = "swimmer";
  }
  return el;
}

function recycleSwimmer(el){
  if (el.isConnected) el.remove();
  activeSwimmers = Math.max(0, activeSwimmers - 1);
  if (swimmerPool.length < MAX_POOL_SWIMMERS) swimmerPool.push(el);
}

function spawnConfettiBubblesBurst(count = 40){
  confettiBurstActive = true;

  const maxCount = Math.min(count, isCoarsePointer ? 18 : 36);
  const available = Math.max(0, MAX_BUBBLES - activeBubbles);
  const finalCount = Math.min(maxCount, available);

  if (finalCount <= 0){
    setTimeout(() => { confettiBurstActive = false; }, 1200);
    return;
  }

  for (let i = 0; i < finalCount; i++){
    const b = getBubbleEl();
    activeBubbles++;

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
    resetBubbleAnimation(b);
  }

  setTimeout(() => { confettiBurstActive = false; }, 1200);
}

// ---------- Swimmers ----------
function createSwimmer(){
  if (activeSwimmers >= MAX_SWIMMERS) return;
  const el = getSwimmerEl();
  activeSwimmers++;

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
  const token = (el._swimToken = (el._swimToken || 0) + 1);

  function step(t){
    if (!el.isConnected || el._swimToken !== token) return;
    if (!running){ requestAnimationFrame(step); return; }

    const p = Math.min(1, (t - start) / (dur * 1000));
    const eased = p * (2 - p);
    const xPos = startX + (endX - startX) * eased;
    const bob = Math.sin((t - start) / 250) * 6;

    el.style.left = `${xPos}px`;
    el.style.transform = `${fromLeft ? "scaleX(1)" : "scaleX(-1)"} translateY(${bob}px)`;

    if (p < 1) requestAnimationFrame(step);
    else recycleSwimmer(el);
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
  if (activeBubbles >= MAX_BUBBLES) return;
  const b = getBubbleEl();
  activeBubbles++;

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
  resetBubbleAnimation(b);
}

function bubbleLoop(){
  if (!running) return;
  const rate = Math.max(120, 420 - level * 35);
  spawnBubble();
  setTimeout(bubbleLoop, rate);
}

// ---------- Particles for feedback ----------
function spawnParticles(x, y, type, count = 5){
  for (let i = 0; i < count; i++){
    const p = document.createElement("div");
    p.className = `particle ${type}`;
    p.style.left = `${x + (Math.random() - 0.5) * 20}px`;
    p.style.top = `${y + (Math.random() - 0.5) * 20}px`;
    entitiesEl.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }
}

// ---------- Damage flash ----------
function triggerDamageFlash(){
  const flash = document.getElementById("damageFlash");
  if (flash){
    flash.classList.add("active");
    setTimeout(() => flash.classList.remove("active"), 200);
  }
}

// ---------- Tutorial ----------
function showTutorial(){
  if (!tutorialOverlay) return;
  tutorialMode = true;
  tutorialStep = 1;
  tutorialCanEat = false;
  tutorialCanDash = false;
  document.body.classList.add("tutorial-running");
  tutorialTitle.textContent = "Tutoriel - Étape 1/3";
  tutorialMsg.textContent = "Déplace la souris pour bouger le poisson. Clique sur 'Suivant' pour continuer.";
  tutorialOverlay.classList.remove("hidden");
  tutorialHand.classList.remove("hidden");
  // Start cursor update for demo
  requestAnimationFrame(tutorialFrame);
}

function tutorialFrame(){
  if (!tutorialMode) return;
  updateCursor();
  updateParallax();
  checkEat(); // Allow eating demo entities
  // Move guiding hand
  if (tutorialHand && tutorialStep === 1) {
    tutorialHand.style.left = `${mouseX - 24}px`;
    tutorialHand.style.top = `${mouseY - 24}px`;
  }
  requestAnimationFrame(tutorialFrame);
}

function nextTutorial(){
  tutorialStep++;
  if (tutorialStep === 2){
    tutorialTitle.textContent = "Tutoriel - Étape 2/3";
    tutorialMsg.textContent = "Mange les nourritures pour gagner des points. Évite les méduses !";
    tutorialCanEat = true;
    tutorialCanDash = false;
    tutorialHand.classList.add("hidden"); // Hide hand
    // Spawn some demo food and malus
    spawnFood(5);
    spawnBonus(2);
    spawnMalus(1);
  } else if (tutorialStep === 3){
    tutorialTitle.textContent = "Tutoriel - Étape 3/3";
    tutorialMsg.textContent = "Utilise le dash (clic droit) pour fuir le boss. Bonne chance !";
    tutorialCanEat = true;
    tutorialCanDash = true;
    // Enable dash for demo
  } else {
    tutorialMode = false;
    hideTutorial();
    isFirstTime = false;
    localStorage.setItem(LS_FIRST_TIME, "true");
    // Start the real game
    resetRunProgress();
    running = true;
    btnStart.textContent = "Pause";
    setRunningUI(true);
    lastFrame = 0;
    bubbleLoop();
    swimmersLoop();
    requestAnimationFrame(frame);
  }
}

function hideTutorial(){
  tutorialMode = false;
  tutorialOverlay?.classList.add("hidden");
  tutorialHand?.classList.add("hidden");
  document.body.classList.remove("tutorial-running");
  // Clear demo entities
  entitiesEl.innerHTML = '';
}

// ---------- Configure level ----------
function configureLevel(){
  speed = 1 + (level - 1) * 0.18;
  target = 15 + (level - 1) * 8;

  baseTime = Math.max(18, 30 - (level - 1) * 1.2) * timeMultiplier;
  
  // En mode Time Attack, on ne réinitialise PAS le temps (il continue de 60 vers 0)
  if (gameMode !== GAME_MODES.timeAttack) {
    timeLeft = baseTime;
  }

  // En mode endless, on ne réinitialise pas le score (il continue d'augmenter)
  if (gameMode !== GAME_MODES.endless) {
    score = 0;
  }
  combo = 1;
  lastEatAt = 0;

  dashCooldown = 0;
  dashTime = 0;
  magnetTime = 0;

  // apply dash upgrade (soft cap)
  dashCooldownMax = Math.max(0.6, 3.0 - runUpDash * 0.12);

  entitiesEl.innerHTML = "";
  
  const foodCount = 40 + level * 2;
  const adjustedCount = isCoarsePointer ? Math.max(12, Math.round(foodCount * 0.45)) : foodCount;
  spawnFood(adjustedCount);

  if (level >= 2) spawnBonus();
  if (level >= 3) spawnMalus();
  if (level >= 5) spawnPowerUp();

  initBoss();
  syncHUD();
}

// ---------- Dash ----------
function tryDash(){
  if ((!running && !tutorialMode) || (tutorialMode && !tutorialCanDash)) return;
  if (dashCooldown > 0) return;

  dashTime = dashTimeMax;
  dashCooldown = dashCooldownMax;

  playDash();
  if (!tutorialMode) syncHUD();
}

// ---------- Win / Lose ----------
function winLevel(){
  if (tutorialMode) return; // Pas de win pendant tutoriel

  running = false;
  btnStart.textContent = "Reprendre";
  hideStatsBox();

  spawnConfettiBubblesBurst(46);
  addMetaXP(15); // récompense de victoire (ajuste si tu veux)

  // Save high score for time attack
  if (gameMode === GAME_MODES.timeAttack) {
    const key = 'highscore_timeAttack';
    const currentHigh = parseInt(localStorage.getItem(key) || '0');
    if (totalScore > currentHigh) {
      localStorage.setItem(key, String(totalScore));
    }
    // Submit to global leaderboard (async, no await needed)
    submitScore(totalScore, gameMode);
  }

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
  if (tutorialMode) return; // Pas de lose pendant tutoriel

  running = false;
  setJoystickVisibility(false);
  resetRunProgress();

  // Save high score for all modes when losing
  let modeKey = 'highscore_normal';
  if (gameMode === GAME_MODES.timeAttack) modeKey = 'highscore_timeAttack';
  if (gameMode === GAME_MODES.endless) modeKey = 'highscore_endless';
  
  const currentHigh = parseInt(localStorage.getItem(modeKey) || '0');
  if (totalScore > currentHigh) {
    localStorage.setItem(modeKey, String(totalScore));
  }
  
  // Submit to global leaderboard for all modes
  submitScore(totalScore, gameMode);

  btnStart.textContent = "Reprendre";
  showStatsBox();
  renderStats();

  let loseMessage = `Temps écoulé. Tu as atteint le niveau ${level}.`;
  if (gameMode === GAME_MODES.endless) {
    loseMessage = `Santé perdue ! Tu as atteint le niveau ${level} avec ${totalScore} points.`;
  }

  showOverlay(
    `Fin de run ❌`,
    loseMessage,
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
  const enemyChance = level >= 2 ? Math.min(0.15, 0.05 + level * 0.01) : 0;

  const roll = Math.random();

  if (roll < bonusChance) return void spawnBonus();
  if (roll < bonusChance + malusChance) return void spawnMalus();
  if (roll < bonusChance + malusChance + powerChance) return void spawnPowerUp();
  if (roll < bonusChance + malusChance + powerChance + enemyChance) return void spawnEnemy();

  const foodCount = isCoarsePointer ? 6 : 10;
  spawnFood(foodCount);
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
  slowTime = Math.max(0, slowTime - dt);

  // Update random events
  updateEvents(dt);

  if (!tutorialMode) {
    if (gameMode !== GAME_MODES.endless) {
      timeLeft -= dt;
      if (timeLeft <= 0){
        timeLeft = 0;
        syncHUD();
        if (gameMode === GAME_MODES.timeAttack) {
          // Time Attack : quand le temps arrive à 0, c'est la fin du jeu (game over)
          loseLevel();
        } else {
          loseLevel();
        }
        return;
      }
    } else {
      // Endless: check health
      if (health <= 0) {
        syncHUD();
        loseLevel();
        return;
      }
    }
  }

  updateCursor();
  updateParallax();
  applyTideEffect();
  checkEat();
  applyMagnet();
  updateBoss(dt);
  updateEnemies(dt);
  maybeSpawnRandom();

  syncHUD();
  requestAnimationFrame(frame);
}

// ---------- Random events ----------
function updateEvents(dt) {
  if (currentEvent) {
    eventTimer -= dt;
    
    // Animer la marée
    if (currentEvent === 'tide') {
      tideOffset += tideDirection * dt * 0.3;
      if (Math.abs(tideOffset) > 1) {
        tideDirection *= -1;
      }
    }
    
    if (eventTimer <= 0) {
      // End event
      endEvent();
      eventTimer = EVENT_INTERVAL + Math.random() * 10; // Next potential event
    }
  } else {
    eventTimer -= dt;
    // En mode endless: événements dès le niveau 1, sinon niveau 5+
    const minLevel = gameMode === GAME_MODES.endless ? 1 : 5;
    if (eventTimer <= 0 && Math.random() < 0.005 && level >= minLevel) { // 0.5% chance
      // Choisir un événement aléatoire avec probabilité égale
      const events = ['storm', 'bloodlust', 'tide', 'plankton', 'murky', 'attack-surprise'];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      startEvent(randomEvent);
    }
  }
}

function endEvent() {
  document.body.classList.remove('storm', 'bloodlust', 'tide', 'plankton', 'murky', 'attack-surprise');
  currentEvent = null;
  currentVX = 0;
  currentVY = 0;
  tideOffset = 0;
  tideDirection = 1;
  planktonActive = false;
  bossSpeedBoost = 1.0; // réinitialiser la vitesse du boss
  bossInvisible = false; // réinitialiser l'invisibilité du boss
  disableBloodDrops();
}

function startEvent(type) {
  currentEvent = type;
  eventTimer = EVENT_DURATION;
  
  // Noms des événements pour l'affichage
  const eventNames = {
    'storm': '⚡ TEMPÊTE ⚡',
    'bloodlust': '🦈 SOIF DE SANG 🦈',
    'tide': '🌊 MARÉE 🌊',
    'plankton': '✨ PLANCTON LUMINEUX ✨',
    'murky': '🌫️ EAU TROUBLE 🌫️',
    'attack-surprise': '💥 ATTAQUE SURPRISE 💥'
  };
  
  // Afficher la notification
  showEventNotification(eventNames[type] || type.toUpperCase());
  
  if (type === 'storm') {
    document.body.classList.add('storm');
  } else if (type === 'bloodlust') {
    // Soif de sang: boost énorme de vitesse du boss
    bossSpeedBoost = 4.0; // 4x la vitesse normale
    document.body.classList.add('bloodlust');
    enableBloodDrops();
  } else if (type === 'tide') {
    // Marée qui fait monter/descendre
    tideOffset = 0;
    tideDirection = Math.random() > 0.5 ? 1 : -1;
    document.body.classList.add('tide');
  } else if (type === 'plankton') {
    // Plancton lumineux - double les points
    planktonActive = true;
    document.body.classList.add('plankton');
  } else if (type === 'murky') {
    // Eau trouble - réduit visibilité et augmente difficulté
    document.body.classList.add('murky');
  } else if (type === 'attack-surprise') {
    // Attaque surprise: boss devient invisible mais toujours actif
    bossInvisible = true;
    document.body.classList.add('attack-surprise');
  }
}

function showEventNotification(eventName) {
  const notification = document.getElementById('eventNotification');
  const textEl = notification.querySelector('.event-notification-text');
  
  if (!notification || !textEl) return;
  
  textEl.textContent = eventName;
  notification.classList.remove('hidden', 'fadeOut');
  
  // Faire disparaître après 2.5 secondes
  setTimeout(() => {
    notification.classList.add('fadeOut');
    setTimeout(() => {
      notification.classList.add('hidden');
    }, 400);
  }, 2500);
}

// ---------- Controls ----------
const joystickContainer = document.getElementById("joystickContainer");
const joystickStick = document.getElementById("joystickStick");
let joystickActive = false;
let joystickX = 0, joystickY = 0;
let joystickRadius = 40;
let joystickDeadzone = 8;

function getJoystickRadius(){
  if (!joystickContainer) return joystickRadius;
  const size = Math.min(joystickContainer.offsetWidth, joystickContainer.offsetHeight);
  return Math.max(26, size / 2 - 6);
}

function getJoystickDeadzone(radius){
  return Math.max(6, radius * 0.2);
}

function setJoystickVisibility(show){
  if (isCoarsePointer){
    if (show) joystickContainer.classList.remove("hidden");
    else joystickContainer.classList.add("hidden");
  }
}

joystickContainer.addEventListener("pointerdown", (e) => {
  if (!isCoarsePointer) return;
  joystickActive = true;
  const rect = joystickContainer.getBoundingClientRect();
  updateJoystick(e.clientX - rect.left, e.clientY - rect.top);
}, { passive: false });

document.addEventListener("pointermove", (e) => {
  if (!joystickActive) return;
  const rect = joystickContainer.getBoundingClientRect();
  updateJoystick(e.clientX - rect.left, e.clientY - rect.top);
}, { passive: true });

document.addEventListener("pointerup", () => {
  joystickActive = false;
  joystickX = 0;
  joystickY = 0;
  joystickStick.style.transform = "translate(0, 0)";
}, { passive: true });

function updateJoystick(px, py){
  const cx = joystickContainer.offsetWidth / 2;
  const cy = joystickContainer.offsetHeight / 2;
  let dx = px - cx;
  let dy = py - cy;
  const dist = Math.hypot(dx, dy);
  const radius = getJoystickRadius();
  const deadzone = getJoystickDeadzone(radius);
  
  if (dist < deadzone){
    joystickX = 0;
    joystickY = 0;
  } else {
    const ratio = Math.min(1, dist / radius);
    joystickX = (dx / dist) * ratio;
    joystickY = (dy / dist) * ratio;
  }
  
  joystickStick.style.transform = `translate(${joystickX * radius}px, ${joystickY * radius}px)`;
}

window.addEventListener("mousemove", (e) => {
  if (!joystickActive){
    mouseX = e.clientX;
    mouseY = e.clientY;
  }
});

window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  tryDash();
});

window.addEventListener("pointermove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
}, { passive: true });

window.addEventListener("pointerdown", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
}, { passive: true });
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

// ---------- OPTIONS PANEL ----------
const optionsOverlay = document.getElementById("optionsOverlay");
const btnOptions = document.getElementById("btnOptions");
const btnCloseOptions = document.getElementById("btnCloseOptions");
const bossSpeedSlider = document.getElementById("bossSpeedSlider");
const bossSpeedValue = document.getElementById("bossSpeedValue");
const timeMultiplierSlider = document.getElementById("timeMultiplierSlider");
const timeMultiplierValue = document.getElementById("timeMultiplierValue");
const parallaxToggle = document.getElementById("parallaxToggle");
const causticsToggle = document.getElementById("causticsToggle");
const swimmersToggle = document.getElementById("swimmersToggle");
const btnResetOptions = document.getElementById("btnResetOptions");

function openOptionsPanel(){
  bossSpeedSlider.value = bossSpeedMultiplier;
  bossSpeedValue.textContent = bossSpeedMultiplier.toFixed(1) + "x";
  timeMultiplierSlider.value = timeMultiplier;
  timeMultiplierValue.textContent = timeMultiplier.toFixed(1) + "x";
  parallaxToggle.checked = parallaxEnabled;
  causticsToggle.checked = causticsEnabled;
  swimmersToggle.checked = swimmersEnabled;
  
  // Pause game if it was running
  wasRunningBeforeOptions = running;
  if (running) {
    running = false;
    setRunningUI(false);
  }
  
  optionsOverlay.classList.remove("hidden");
}

function closeOptionsPanel(){
  optionsOverlay.classList.add("hidden");
  
  // Resume game if it was running before opening options
  if (wasRunningBeforeOptions) {
    running = true;
    setRunningUI(true);
    wasRunningBeforeOptions = false;
  }
}

btnOptions?.addEventListener("click", openOptionsPanel);
btnCloseOptions?.addEventListener("click", closeOptionsPanel);

bossSpeedSlider?.addEventListener("input", (e) => {
  bossSpeedMultiplier = parseFloat(e.target.value);
  bossSpeedValue.textContent = bossSpeedMultiplier.toFixed(1) + "x";
  saveGameOptions();
});

timeMultiplierSlider?.addEventListener("input", (e) => {
  timeMultiplier = parseFloat(e.target.value);
  timeMultiplierValue.textContent = timeMultiplier.toFixed(1) + "x";
  saveGameOptions();
});

parallaxToggle?.addEventListener("change", (e) => {
  parallaxEnabled = e.target.checked;
  saveGameOptions();
});

causticsToggle?.addEventListener("change", (e) => {
  causticsEnabled = e.target.checked;
  saveGameOptions();
});

swimmersToggle?.addEventListener("change", (e) => {
  swimmersEnabled = e.target.checked;
  saveGameOptions();
});

btnResetOptions?.addEventListener("click", () => {
  if (confirm("Réinitialiser toutes les options par défaut ?")){
    bossSpeedMultiplier = 1.0;
    timeMultiplier = 1.0;
    parallaxEnabled = true;
    causticsEnabled = true;
    swimmersEnabled = true;
    saveGameOptions();
    openOptionsPanel();
  }
});

optionsOverlay?.addEventListener("click", (e) => {
  if (e.target === optionsOverlay) closeOptionsPanel();
});

applyVisualOptions();

// ---------- Start from overlay ----------
async function startGameFromOverlay(){
  // start new run
  resetRunProgress();
  initializeGameForMode();

  hideRules();
  hideOverlay();
  hideStatsBox();
  hideUpgradesBox();

  running = true;
  btnStart.textContent = "Pause";
  setRunningUI(true);
  setJoystickVisibility(true);

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
    initializeGameForMode();

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
    setJoystickVisibility(false);
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
  setJoystickVisibility(false);

  showRules();
});

// Top Leaderboard (affichage en haut à droite)
async function updateTopLeaderboard(mode) {
  try {
    const scores = await getLeaderboard(mode, 3);
    
    topLeaderboardList.innerHTML = '';
    
    if (!scores || scores.length === 0) {
      topLeaderboardList.innerHTML = '<div class="top-leaderboard-item">Aucun score</div>';
      return;
    }

    scores.forEach((entry, index) => {
      const item = document.createElement("div");
      let rankClass = '';
      if (index === 0) rankClass = 'rank1';
      else if (index === 1) rankClass = 'rank2';
      else if (index === 2) rankClass = 'rank3';
      
      item.className = `top-leaderboard-item ${rankClass}`;
      const username = entry.username || 'Anonyme';
      item.textContent = `${index + 1}. ${username} - ${entry.score || 0}`;
      topLeaderboardList.appendChild(item);
    });
  } catch (error) {
    console.error('Erreur chargement classement:', error);
    topLeaderboardList.innerHTML = '<div class="top-leaderboard-item">Erreur</div>';
  }
}

// Charger le classement initial
setGameMode(GAME_MODES.normal);

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

// USERNAME MODAL SYSTEM
function showUsernameModal(initialErrorText = "") {
  const modal = document.getElementById('usernameModal');
  const input = document.getElementById('usernameInput');
  const btnSet = document.getElementById('btnSetUsername');
  const errorMsg = document.getElementById('usernameError');
  
  modal.classList.remove('hidden');
  input.value = '';
  input.focus();
  if (initialErrorText) {
    errorMsg.textContent = initialErrorText;
    errorMsg.style.display = 'block';
  } else {
    errorMsg.style.display = 'none';
  }
  
  async function submitUsername() {
    const username = input.value.trim();
    if (username.length < 2) {
      errorMsg.textContent = 'Le nom doit avoir au moins 2 caractères';
      errorMsg.style.display = 'block';
      return;
    }
    if (username.length > 20) {
      errorMsg.textContent = 'Le nom ne doit pas dépasser 20 caractères';
      errorMsg.style.display = 'block';
      return;
    }
    
    const userId = getUserId();
    const reserve = await reserveUsername(userId, username);
    if (!reserve.ok) {
      errorMsg.textContent = reserve.reason === 'taken'
        ? 'Ce nom est déjà pris. Choisissez un autre.'
        : 'Impossible de reserver ce nom. Reessayez.';
      errorMsg.style.display = 'block';
      return;
    }

    setUsername(username);
    saveUsernameToCloud(userId, username);
    modal.classList.add('hidden');
    
    // Ne pas lancer le jeu, juste fermer le modal
    // L'utilisateur devra cliquer sur "Démarrer" pour commencer
  }
  
  btnSet.onclick = submitUsername;
  input.onkeyup = (e) => {
    if (e.key === 'Enter') submitUsername();
  };
}

// Check if username exists on startup, show modal if needed
if (!getUsername()) {
  showUsernameModal();
}

configureLevel();
syncHUD();
setRunningUI(false);
if (isFirstTime) {
  showTutorial();
} else {
  showRules();
}
applyEquippedSkins();
renderMetaBar();

// Tutorial events
if (btnTutorialNext) btnTutorialNext.addEventListener("click", nextTutorial);
if (btnSkipTutorial) btnSkipTutorial.addEventListener("click", () => {
  tutorialMode = false;
  hideTutorial();
  isFirstTime = false;
  localStorage.setItem(LS_FIRST_TIME, "true");
  showUsernameModal(); // Force name choice
});

// Exports pour tests
export { checkEat, syncHUD, addMetaXP, saveMeta };


