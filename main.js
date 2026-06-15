import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 40, 120);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(0, 6, 24);
camera.lookAt(0, 1, 12);

// LIGHTING
scene.add(new THREE.AmbientLight(0x334466, 2));
const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);
scene.add(new THREE.HemisphereLight(0xff8844, 0x112244, 0.6));

const scrollables = [];
const SPEED = 0.5;

// ── ROAD ──────────────────────────────────────────
const roadMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
const ROAD_LENGTH = 80;
const NUM_SEGMENTS = 4;
for (let i = 0; i < NUM_SEGMENTS; i++) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, ROAD_LENGTH), roadMat);
    seg.position.z = -ROAD_LENGTH + i * ROAD_LENGTH;
    seg._loopLen = ROAD_LENGTH * NUM_SEGMENTS;
    seg._camOffset = ROAD_LENGTH;
    scene.add(seg);
    scrollables.push(seg);
}

// ── TROTOAR ─────────────────────────────────────────
const trotoarMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
for (let side of [-1, 1]) {
    for (let i = 0; i < NUM_SEGMENTS; i++) {
        const t = new THREE.Mesh(new THREE.BoxGeometry(3, 0.35, ROAD_LENGTH), trotoarMat);
        t.position.set(side * 7.5, 0.08, -ROAD_LENGTH + i * ROAD_LENGTH);
        t._loopLen = ROAD_LENGTH * NUM_SEGMENTS;
        t._camOffset = ROAD_LENGTH;
        scene.add(t);
        scrollables.push(t);
    }
}

// ── MARKA ─────────────────────────────────────────
const markaMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
const markaList = [];
const DASH_LEN = 3, DASH_GAP = 3, DASH_TOTAL = 6, NUM_DASHES = 40;
for (let x of [-2, 2]) {
    for (let i = 0; i < NUM_DASHES; i++) {
        const d = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.01, DASH_LEN), markaMat);
        d.position.set(x, 0.11, i * DASH_TOTAL - (DASH_TOTAL * NUM_DASHES) / 2 + 40);
        scene.add(d);
        markaList.push(d);
    }
}

// ── HELPER: buat pohon ────────────────────────────
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d1e });
const leafMat  = new THREE.MeshStandardMaterial({ color: 0x1a5c2a });
const trunkGeo = new THREE.CylinderGeometry(0.18, 0.22, 1.5, 6);
const leafGeo  = new THREE.ConeGeometry(1.4, 3.5, 6);

function makeTree(x, z) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.75;
    g.add(trunk);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.y = 3;
    g.add(leaf);
    g.position.set(x, 1.2, z);
    return g;
}

// ── HELPER: buat lampu jalan ──────────────────────
function makeLamp(x, z) {
    const g = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 5.5, 5), poleMat);
    pole.position.y = 2.75;
    g.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.1), poleMat);
    arm.position.set(x > 0 ? -0.8 : 0.8, 5.6, 0);
    g.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 0.38),
        new THREE.MeshStandardMaterial({ color: 0x333333 }));
    head.position.set(x > 0 ? -1.5 : 1.5, 5.5, 0);
    g.add(head);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 5, 5),
        new THREE.MeshStandardMaterial({ color: 0xffee88, emissive: 0xffdd44, emissiveIntensity: 2.5 }));
    bulb.position.set(x > 0 ? -1.5 : 1.5, 5.28, 0);
    g.add(bulb);
    g.position.set(x, 0.18, z);
    return g;
}

// ── HELPER: buat gedung ───────────────────────────
const bldColors = [0x1e2a3a, 0x16213e, 0x0f3460, 0x222831, 0x2d3436, 0x1b1b2f];
const winOn  = new THREE.MeshStandardMaterial({ color: 0xffee88, emissive: 0xffcc44, emissiveIntensity: 0.9 });
const winOff = new THREE.MeshStandardMaterial({ color: 0x334466, emissive: 0x112233, emissiveIntensity: 0.2 });

function makeBuilding(x, z, forceW, forceH) {
    const g = new THREE.Group();
    const w = forceW || (4 + Math.random() * 5);
    const h = forceH || (8 + Math.random() * 22);
    const d = 4 + Math.random() * 4;
    const mat = new THREE.MeshStandardMaterial({ color: bldColors[Math.floor(Math.random() * bldColors.length)] });
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    body.position.y = h / 2;
    g.add(body);
    const cols = Math.min(3, Math.max(1, Math.floor(w / 2)));
    const rows = Math.min(5, Math.max(1, Math.floor(h / 3)));
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.05),
                Math.random() > 0.4 ? winOn : winOff);
            win.position.set(-w / 2 + 1 + c * (w / cols), 1.8 + r * (h / rows), d / 2 + 0.01);
            g.add(win);
        }
    }
    g.position.set(x, 0, z);
    return g;
}

// ── SPAWN LINGKUNGAN ───────────────────────────────
const envPool = [];
const ENV_SPACING = 10;
const ENV_COUNT  = 10;
const TOTAL_ENV  = ENV_COUNT * ENV_SPACING;

for (let i = 0; i < ENV_COUNT; i++) {
    const z = i * ENV_SPACING - TOTAL_ENV / 2;
    if (i % 2 === 0) {
        const tL = makeTree(-9.5 + (Math.random() - 0.5), z + (Math.random() - 0.5) * 3);
        const tR = makeTree( 9.5 + (Math.random() - 0.5), z + (Math.random() - 0.5) * 3);
        scene.add(tL); scene.add(tR);
        envPool.push(tL, tR);
    }
    if (i % 2 === 0) {
        const lL = makeLamp(-6.5, z);
        scene.add(lL); envPool.push(lL);
    } else {
        const lR = makeLamp(6.5, z);
        scene.add(lR); envPool.push(lR);
    }
    const bL = makeBuilding(-(15 + Math.random() * 3), z);
    const bR = makeBuilding( (15 + Math.random() * 3), z);
    scene.add(bL); scene.add(bR);
    envPool.push(bL, bR);
}

// ── PLAYER ────────────────────────────────────────
const player = new THREE.Group();
player.position.set(0, 0, 15);
player.rotation.y = 0;
scene.add(player);

const loader = new GLTFLoader();
loader.load('MOBIL.glb', (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const sz = new THREE.Vector3(); box.getSize(sz);
    model.scale.setScalar(1.5 / sz.y);
    const b2 = new THREE.Box3().setFromObject(model);
    model.position.y = -b2.min.y + 0.1;
    player.add(model);
}, undefined, () => {
    const fb = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 3.5),
        new THREE.MeshStandardMaterial({ color: 0xff2200 }));
    fb.position.y = 0.6; player.add(fb);
});

// ── GAME VARS ─────────────────────────────────────
const lanes = [-4, 0, 4];
let currentLane = 1;
let score = 0;
let gameRunning = false;
let gamePaused = false;
const obstacles = [], coins = [];

const coinCount = document.getElementById("coinCount");

// ── OBSTACLE ──────────────────────────────────────
let barricadeTemplate = null;
loader.load('barricade.glb', (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const sz = new THREE.Vector3(); box.getSize(sz);
    model.scale.setScalar(3 / sz.y);
    const b2 = new THREE.Box3().setFromObject(model);
    model.position.y = -b2.min.y + 0.1;
    barricadeTemplate = model;
}, undefined, (e) => console.error(e));

function createObstacle() {
    const shuffled = [0, 1, 2].sort(() => Math.random() - 0.5);
    const count = Math.random() < 0.5 ? 1 : 2;
    for (let i = 0; i < count; i++) {
        let obs;
        if (barricadeTemplate) {
            obs = barricadeTemplate.clone(true);
        } else {
            obs = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2),
                new THREE.MeshStandardMaterial({ color: 0xff0000 }));
            obs.position.y = 1;
        }
        obs.position.x = lanes[shuffled[i]];
        obs.position.z = -40;
        scene.add(obs); obstacles.push(obs);
    }
}

// ── COIN ──────────────────────────────────────────
let coinTemplate = null;
loader.load('coin.glb', (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const sz = new THREE.Vector3(); box.getSize(sz);
    model.scale.setScalar(1.8 / sz.y);
    const b2 = new THREE.Box3().setFromObject(model);
    model.position.y = -b2.min.y;
    coinTemplate = model;
}, undefined, (e) => console.error('coin.glb error:', e));

function createCoin() {
    let coin;
    if (coinTemplate) {
        coin = coinTemplate.clone(true);
    } else {
        coin = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16),
            new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x665500 })
        );
    }
    coin.position.set(lanes[Math.floor(Math.random() * 3)], 1.5, -40);
    scene.add(coin); coins.push(coin);
}

setInterval(() => { if (gameRunning && !gamePaused) createObstacle(); }, 2000);
setInterval(() => { if (gameRunning && !gamePaused && coinTemplate) createCoin(); }, 1500);

// ── UI HANDLERS ───────────────────────────────────
const startOverlay = document.getElementById("startOverlay");
const pauseOverlay = document.getElementById("pauseOverlay");
const pauseBtn     = document.getElementById("pauseBtn");
const resumeBtn    = document.getElementById("resumeBtn");

document.getElementById("startBtn").onclick = () => {
    startOverlay.style.display = "none";
    gameRunning = true;
};

function togglePause() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    pauseOverlay.style.display = gamePaused ? "flex" : "none";
    pauseBtn.textContent = gamePaused ? "▶ Resume" : "⏸ Pause";
    gamePaused ? bgMusic.pause() : bgMusic.play();
}

pauseBtn.onclick = togglePause;
resumeBtn.onclick = togglePause;
document.getElementById("restartBtn").onclick = () => location.reload();

// ── KEYBOARD ──────────────────────────────────────
window.addEventListener("keydown", (e) => {
    if (e.code === "Space") { e.preventDefault(); togglePause(); return; }
    if (gamePaused) return;
    if (e.key === "ArrowLeft"  || e.key === "a") { if (currentLane > 0) currentLane--; }
    if (e.key === "ArrowRight" || e.key === "d") { if (currentLane < 2) currentLane++; }
});

// ── MOBILE ARROW BUTTONS ──────────────────────────
document.getElementById("leftBtn").addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!gamePaused && currentLane > 0) currentLane--;
}, { passive: false });

document.getElementById("rightBtn").addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!gamePaused && currentLane < 2) currentLane++;
}, { passive: false });

document.getElementById("leftBtn").onclick  = () => { if (!gamePaused && currentLane > 0) currentLane--; };
document.getElementById("rightBtn").onclick = () => { if (!gamePaused && currentLane < 2) currentLane++; };

// ── BACKGROUND MUSIC ──────────────────────────────
const bgMusic = new Audio('BACKSOUNDADIT.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5;

document.getElementById("startBtn").addEventListener("click", () => {
    bgMusic.play();
}, { once: true });

// ── SOUND EFFECTS (Web Audio API) ─────────────────
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playCoinSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.25);
}

function playCrashSound() {
    const t = audioCtx.currentTime;

    // layer 1: noise burst panjang & keras
    const bufferSize = audioCtx.sampleRate * 0.8;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1200, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(80, t + 0.6);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(1.2, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noise.start(t);

    // layer 2: sub bass dalam yang turun drastis
    const sub = audioCtx.createOscillator();
    const subGain = audioCtx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(180, t);
    sub.frequency.exponentialRampToValueAtTime(25, t + 0.5);
    subGain.gain.setValueAtTime(0.9, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    sub.connect(subGain);
    subGain.connect(audioCtx.destination);
    sub.start(t);
    sub.stop(t + 0.5);

    // layer 3: mid punch (impact awal)
    const punch = audioCtx.createOscillator();
    const punchGain = audioCtx.createGain();
    punch.type = 'square';
    punch.frequency.setValueAtTime(300, t);
    punch.frequency.exponentialRampToValueAtTime(60, t + 0.15);
    punchGain.gain.setValueAtTime(0.8, t);
    punchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    punch.connect(punchGain);
    punchGain.connect(audioCtx.destination);
    punch.start(t);
    punch.stop(t + 0.15);

    // layer 4: distorsi metal (getaran besi)
    const metal = audioCtx.createOscillator();
    const metalGain = audioCtx.createGain();
    const metalFilter = audioCtx.createBiquadFilter();
    metal.type = 'sawtooth';
    metal.frequency.setValueAtTime(440, t + 0.02);
    metal.frequency.setValueAtTime(220, t + 0.05);
    metal.frequency.setValueAtTime(330, t + 0.1);
    metalFilter.type = 'bandpass';
    metalFilter.frequency.setValueAtTime(800, t);
    metalFilter.Q.setValueAtTime(2, t);
    metalGain.gain.setValueAtTime(0.5, t + 0.02);
    metalGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    metal.connect(metalFilter);
    metalFilter.connect(metalGain);
    metalGain.connect(audioCtx.destination);
    metal.start(t + 0.02);
    metal.stop(t + 0.35);
}

// ── COLLISION ─────────────────────────────────────
function checkCollision(a, b) {
    return new THREE.Box3().setFromObject(a).intersectsBox(new THREE.Box3().setFromObject(b));
}

// ── GAME OVER ─────────────────────────────────────
function gameOver() {
    gameRunning = false;
    bgMusic.pause();
    bgMusic.currentTime = 0;
    pauseOverlay.style.display = "flex";
    pauseOverlay.querySelector("h2").textContent = "GAME OVER";
    resumeBtn.style.display = "none";

    let scoreEl = document.getElementById("goScore");
    if (!scoreEl) {
        scoreEl = document.createElement("p");
        scoreEl.id = "goScore";
        scoreEl.style.cssText = "font-size:20px; margin-top:-10px;";
        pauseOverlay.insertBefore(scoreEl, resumeBtn);
    }
    scoreEl.textContent = "🪙 Coin Collected: " + score;

    let playAgainBtn = document.getElementById("playAgainBtn");
    if (!playAgainBtn) {
        playAgainBtn = document.createElement("button");
        playAgainBtn.id = "playAgainBtn";
        playAgainBtn.textContent = "Play Again";
        playAgainBtn.style.cssText = "padding:10px 32px; font-size:18px; font-weight:bold; border:none; border-radius:10px; background:#fff; color:#222; cursor:pointer;";
        playAgainBtn.onmouseenter = () => playAgainBtn.style.background = "#ddd";
        playAgainBtn.onmouseleave = () => playAgainBtn.style.background = "#fff";
        pauseOverlay.appendChild(playAgainBtn);
    }
    playAgainBtn.onclick = () => {
        // reset semua obstacle & coin
        for (let i = obstacles.length - 1; i >= 0; i--) {
            scene.remove(obstacles[i]); obstacles.splice(i, 1);
        }
        for (let i = coins.length - 1; i >= 0; i--) {
            scene.remove(coins[i]); coins.splice(i, 1);
        }
        // reset skor & lane
        score = 0;
        coinCount.textContent = 0;
        currentLane = 1;
        player.position.x = lanes[1];
        // reset overlay
        pauseOverlay.style.display = "none";
        pauseOverlay.querySelector("h2").textContent = "PAUSED";
        resumeBtn.style.display = "";
        scoreEl.remove();
        playAgainBtn.remove();
        // mulai lagi
        bgMusic.currentTime = 0;
        bgMusic.play();
        gameRunning = true;
        gamePaused = false;
        pauseBtn.textContent = "⏸ Pause";
    };
}

// ── LOOP ──────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);

    if (gamePaused || !gameRunning) {
        renderer.render(scene, camera);
        return;
    }

    player.position.x += (lanes[currentLane] - player.position.x) * 0.15;

    for (const seg of scrollables) {
        seg.position.z += SPEED;
        if (seg.position.z > camera.position.z + (seg._camOffset || ROAD_LENGTH)) {
            seg.position.z -= seg._loopLen || ROAD_LENGTH * NUM_SEGMENTS;
        }
    }
    for (const d of markaList) {
        d.position.z += SPEED;
        if (d.position.z > 50) d.position.z -= DASH_TOTAL * NUM_DASHES;
    }
    for (const obj of envPool) {
        obj.position.z += SPEED;
        if (obj.position.z > camera.position.z + 20) obj.position.z -= TOTAL_ENV;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.position.z += SPEED;
        if (checkCollision(player, obs)) { playCrashSound(); gameOver(); return; }
        if (obs.position.z > 30) { scene.remove(obs); obstacles.splice(i, 1); }
    }

    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.rotation.y += 0.1;
        coin.position.z += SPEED;
        if (checkCollision(player, coin)) {
            playCoinSound();
            score++;
            coinCount.textContent = score;
            scene.remove(coin); coins.splice(i, 1);
            continue;
        }
        if (coin.position.z > 30) { scene.remove(coin); coins.splice(i, 1); }
    }

    renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
