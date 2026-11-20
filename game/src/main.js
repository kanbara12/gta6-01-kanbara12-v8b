// SUNCOAST: HEATLINE — boot, game loop, driving, on-foot combat, camera,
// pedestrians, police pursuit, heli orbit and screenshot-mode staging.
import * as THREE from 'three';
import { STAGES, MISSIONS, START_CASH, YARD_BOUNTY } from './config.js';
import { buildWorld } from './world.js';
import { buildHeroCar, buildTraffic, buildPolice, buildHeli } from './vehicles.js';
import { freshState, missionOf, completeMission } from './missions.js';
import { updateHUD, showPopup, updatePause, drawMinimap } from './hud.js';
import { createAudio } from './audio.js';
import { applyShot } from './shots.js';

const errors = [];
window.addEventListener('error', (e) => errors.push(String(e.message || e.error)));
window.addEventListener('unhandledrejection', (e) => errors.push(String(e.reason)));

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = parseInt(params.get('seed') || '1', 10) || 1;

const state = freshState();
const audio = createAudio();
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.domElement.className = 'game';
document.getElementById('app').prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x3a2340, 120, 420);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 1200);
camera.position.set(30, 18, 80);

const world = buildWorld(scene);
const car = buildHeroCar();
car.position.set(8, 0, 40); car.rotation.y = Math.PI;
scene.add(car);

// Player on foot: body, head, and a pistol held out in front.
const player = new THREE.Group();
{
  const suit = new THREE.MeshStandardMaterial({ color: 0x2e5e8c, roughness: 0.8 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.32), suit);
  torso.position.y = 1.15; player.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xc98e6a }));
  head.position.y = 1.7; player.add(head);
  const legM = new THREE.MeshStandardMaterial({ color: 0x22222c });
  for (const x of [-0.14, 0.14]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.22), legM);
    leg.position.set(x, 0.4, 0); player.add(leg);
  }
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.55), suit);
  arm.position.set(0.32, 1.25, 0.3); player.add(arm);
}
const pistol = new THREE.Group();
{
  const gunM = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35, metalness: 0.7 });
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.42), gunM);
  pistol.add(slide);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 8), gunM);
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.02, 0.3); pistol.add(barrel);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.1), gunM);
  grip.position.set(0, -0.15, -0.12); pistol.add(grip);
}
pistol.position.set(0.34, 1.28, 0.55);
player.add(pistol);
// Muzzle-flash starburst (canvas star, additive) at the barrel tip.
const flashTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.translate(64, 64);
  for (let i = 0; i < 8; i++) {
    g.rotate(Math.PI / 4);
    const grad = g.createLinearGradient(0, 0, 0, -62);
    grad.addColorStop(0, 'rgba(255,250,210,1)'); grad.addColorStop(1, 'rgba(255,160,40,0)');
    g.fillStyle = grad;
    g.beginPath(); g.moveTo(-7, 0); g.lineTo(0, -62); g.lineTo(7, 0); g.closePath(); g.fill();
  }
  const core = g.createRadialGradient(0, 0, 2, 0, 0, 20);
  core.addColorStop(0, 'rgba(255,255,240,1)'); core.addColorStop(1, 'rgba(255,200,80,0)');
  g.fillStyle = core; g.beginPath(); g.arc(0, 0, 20, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); return t;
})();
const flash = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5),
  new THREE.MeshBasicMaterial({ map: flashTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
flash.position.set(0.34, 1.3, 1.15);
player.add(flash);
flash.visible = false;
player.position.set(5, 0, 44); player.rotation.y = Math.PI;
player.visible = false;
scene.add(player);

const traffic = buildTraffic(scene);
const police = buildPolice(scene);
police.forEach((u) => { u.visible = false; });
const heli = buildHeli(scene);
heli.visible = false;
heli.position.set(30, 30, 20);

// Pedestrians: 20 walkers on the sidewalks, with a walking bob.
const walkers = [];
{
  const cols = [0xd94f4f, 0x4fae5e, 0x3d7ac9, 0xf2e3c8, 0x7a5ec9, 0xc9a13d];
  for (let i = 0; i < 20; i++) {
    const w = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.85, 0.3),
      new THREE.MeshStandardMaterial({ color: cols[i % cols.length] }));
    b.position.y = 0.95; w.add(b);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xc98e6a }));
    h.position.y = 1.6; w.add(h);
    const side = i % 2 === 0 ? 16 : -11;
    w.position.set(side, 0, -240 + i * 25);
    w.userData = { side, speed: 1 + (i % 3) * 0.4, dir: i % 2 === 0 ? 1 : -1, phase: i };
    scene.add(w); walkers.push(w);
  }
}

// Yard enemies with health bars (DOM, projected each frame).
const enemies = [];
{
  const defs = [
    { name: 'YARD-1', x: 129, z: 146 }, { name: 'YARD-2', x: 136, z: 141 }, { name: 'YARD-3', x: 143, z: 147 },
  ];
  for (const d of defs) {
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xc23b2e }));
    b.position.y = 1.0; g.add(b);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xc98e6a }));
    h.position.y = 1.7; g.add(h);
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x111111 }));
    gun.position.set(0.3, 1.1, 0.3); g.add(gun);
    g.position.set(d.x, 0, d.z);
    g.visible = false;
    scene.add(g);
    const bar = document.createElement('div');
    bar.className = 'enemybar'; bar.style.display = 'none';
    bar.innerHTML = `<span>${d.name}</span><i></i>`;
    document.getElementById('enemybars').appendChild(bar);
    enemies.push({ group: g, hp: 100, down: false, name: d.name, bar });
  }
}

// Game context shared with the shot stager.
const G = {
  state, scene, camera, car, player, heli, police, traffic, enemies, flash,
  world, marker: world.marker, wheelSpin: false,
  forward: { x: 0, z: -1 }, right: { x: 1, z: 0 },
  staged: null, frozen: false, mode: 'drive', dialogue: null, driftSticky: null,
  district: 'BEACHFRONT • Beachfront Rd', tod: 'GOLDEN', stagedName: null, flashFrozen: false,
};
world.marker.position.set(8, 0, -5);

// Driving model.
const drive = { speed: 0, heading: Math.PI, driftCd: 0, nearCd: 0 };
const keys = {};
let mouseDown = false;

addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
  if (e.code === 'KeyH') document.getElementById('hud').classList.toggle('hidden');
  if (e.code === 'KeyM') { state.muted = audio.toggleMute(); }
  if (e.code === 'KeyR') { state.radio = (state.radio + 1) % 3; audio.setStation(state.radio); }
  if (e.code === 'KeyE' && state.started && !state.paused) toggleCar();
  if (e.code.startsWith('Digit')) {
    const n = parseInt(e.code.slice(5), 10) - 1;
    if (n >= 0 && n < 4) state.weapon = n;
  }
  if (e.code === 'KeyZ') showPopup('RAE — CLEAN SLATE READY');
  if (e.code === 'KeyX') showPopup('SABLE — EYES UP: HEAT DROPPED');
  if (e.code === 'KeyC') showPopup('MARLO — PIT STOP: COND +10%');
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('mousedown', () => { mouseDown = true; if (state.started && !state.inCar && !state.paused) shoot(); });
addEventListener('mouseup', () => { mouseDown = false; });
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function togglePause() {
  if (!state.started) return;
  state.paused = !state.paused;
  updatePause(state);
}
function toggleCar() {
  state.inCar = !state.inCar;
  if (!state.inCar) {
    player.position.set(car.position.x - 3, 0, car.position.z + 2);
    player.rotation.y = car.rotation.y;
    player.visible = true;
  } else {
    player.visible = false;
  }
  audio.beep();
}

const raycaster = new THREE.Raycaster();
function shoot() {
  if (state.weapon === 3) return; // bat: no shot
  audio.shot();
  flash.visible = true;
  setTimeout(() => { if (!G.flashFrozen) flash.visible = false; }, 90);
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = raycaster.intersectObjects(enemies.filter((e) => !e.down).map((e) => e.group), true);
  if (hits.length > 0) {
    let obj = hits[0].object;
    while (obj.parent && obj.parent !== scene) obj = obj.parent;
    const en = enemies.find((e) => e.group === obj);
    if (en) {
      en.hp -= 34;
      if (en.hp <= 0) {
        en.hp = 0; en.down = true;
        en.group.rotation.z = Math.PI / 2;
        state.targetsDown += 1;
        state.cash += YARD_BOUNTY;
        showPopup(`BOUNTY +$${YARD_BOUNTY}`);
      }
    }
  }
}

function startGame() {
  document.getElementById('start').style.display = 'none';
  state.started = true;
  state.inCar = false;
  player.visible = true;
  player.position.set(5, 0, 44);
  audio.unlock();
}
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-resume').addEventListener('click', togglePause);
document.getElementById('btn-save').addEventListener('click', () => {
  try { localStorage.setItem('heatline-save', JSON.stringify(state)); showPopup('SAVED'); } catch (e) {}
});
document.getElementById('btn-load').addEventListener('click', () => {
  try {
    const s = JSON.parse(localStorage.getItem('heatline-save') || 'null');
    if (s) Object.assign(state, s);
  } catch (e) {}
});

function markerFor(job) {
  return [
    { x: 8, z: -5 }, { x: 8, z: -120 }, { x: 120, z: 40 }, { x: 136, z: 147 },
    { x: 8, z: 150 }, { x: 8, z: -200 }, { x: -8, z: 180 }, { x: 10, z: -262 },
  ][job - 1];
}

const clock = new THREE.Clock();
let attract = 0;
let frames = 0;
let shotReady = false;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  frames++;

  // Ambient life: wheel turns, ocean scrolls, heli rotor spins, spotlight pool stays on the road.
  if (world.wheel) world.wheel.rotation.z += dt * 0.12;
  if (world.ocean) world.ocean.material.map.offset.y += dt * 0.02;
  if (heli.visible) {
    heli.userData.rotor.rotation.y += dt * 22;
    heli.userData.pool.position.y = -(heli.position.y - 0.35);
    heli.userData.cone.scale.y = Math.max(0.5, heli.position.y / 30);
    heli.userData.cone.position.y = -heli.position.y / 2;
  }

  const onFoot = !state.inCar;
  const fwd = { x: Math.sin(drive.heading), z: Math.cos(drive.heading) };
  const right = { x: -Math.cos(drive.heading), z: Math.sin(drive.heading) };

  if (state.started && !state.paused) {
    state.elapsed += dt;
    if (G.frozen) state.elapsed = (G.staged ? G.staged.elapsed : 0) + (t - (G.stageT0 || t)) * 0;
    // Driving.
    if (state.inCar) {
      const accel = keys.KeyW || keys.ArrowUp ? 16 : 0;
      const brake = keys.KeyS || keys.ArrowDown ? 22 : 0;
      drive.speed += (accel - brake) * dt;
      drive.speed -= drive.speed * 0.35 * dt;
      if (drive.speed < 0) drive.speed = Math.max(drive.speed, -6);
      if (drive.speed > 56) drive.speed = 56;
      const steer = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
      const drifting = (keys.Space && Math.abs(drive.speed) > 14 && steer !== 0);
      drive.heading += steer * (drifting ? 1.9 : 1.15) * dt * Math.min(1, Math.abs(drive.speed) / 12 + 0.25) * Math.sign(drive.speed || 1);
      car.position.x += Math.sin(drive.heading) * drive.speed * dt;
      car.position.z += Math.cos(drive.heading) * drive.speed * dt;
      car.position.x = Math.max(-12, Math.min(300, car.position.x));
      car.position.z = Math.max(-270, Math.min(270, car.position.z));
      car.rotation.y = drive.heading;
      car.rotation.z = -steer * 0.03 * Math.min(1, Math.abs(drive.speed) / 20);
      car.userData.brakeMat.emissiveIntensity = brake ? 3.2 : 1.6;
      car.userData.wheels.forEach((w) => { w.rotation.x += drive.speed * dt * 2.4; });
      if (drifting && drive.driftCd <= 0 && !G.frozen) {
        drive.driftCd = 3;
        state.driftEarned += 150; state.cash += 150;
        showPopup('DRIFT x3 +$150');
      }
      drive.driftCd -= dt;
      state.speed = Math.abs(drive.speed) * 3.6;
      audio.setSpeed(state.speed);
      // Mission marker trigger.
      const mk = state.markerAt;
      const md = Math.hypot(car.position.x - mk.x, car.position.z - mk.z);
      if (md < 6) {
        const isYard = state.job === 4;
        if (!isYard || state.targetsDown >= 3) {
          const extra = isYard ? state.targetsDown * YARD_BOUNTY : 0;
          const r = completeMission(state, extra);
          audio.beep();
          showPopup(r.done ? 'LOOP COMPLETE — $22,450' : `JOB DONE +$${r.pay.toLocaleString('en-US')}`);
          if (!state.loopDone) {
            state.markerAt = markerFor(state.job);
            world.marker.position.set(state.markerAt.x, 0, state.markerAt.z);
          }
        }
      }
    } else {
      // On foot movement, camera-relative.
      const mv = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
      const st = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
      const sp = 6;
      player.position.x += (fwd.x * mv + right.x * st) * sp * dt;
      player.position.z += (fwd.z * mv + right.z * st) * sp * dt;
      player.position.y = Math.abs(Math.sin(t * 9)) * 0.06 * (mv || st ? 1 : 0);
      if (mv || st) player.rotation.y = Math.atan2(fwd.x * mv + right.x * st, fwd.z * mv + right.z * st);
      state.speed = 0;
      const mk = state.markerAt;
      const md = Math.hypot(player.position.x - mk.x, player.position.z - mk.z);
      if (state.job === 4 && state.targetsDown >= 3 && md < 6) {
        const r = completeMission(state, state.targetsDown * YARD_BOUNTY);
        showPopup(`JOB DONE +$${r.pay.toLocaleString('en-US')}`);
        state.markerAt = markerFor(state.job);
        world.marker.position.set(state.markerAt.x, 0, state.markerAt.z);
      }
    }
    // Traffic loops along the lanes (held still in staged frames).
    for (const c of traffic) {
      if (!c.visible || G.frozen) continue;
      c.position.z += c.userData.dir * c.userData.speed * dt;
      if (c.position.z > 275) c.position.z = -275;
      if (c.position.z < -275) c.position.z = 275;
      if (state.inCar && Math.abs(c.position.z - car.position.z) < 3 && Math.abs(c.position.x - car.position.x) < 3.2
        && state.speed > 55 && drive.nearCd <= 0 && !G.frozen) {
        drive.nearCd = 4; state.cash += 50; state.nearMissEarned += 50;
        showPopup('NEAR MISS +$50');
      }
    }
    drive.nearCd -= dt;
    // Pedestrians walk, scatter from the speeding car.
    for (const w of walkers) {
      const dCar = Math.hypot(w.position.x - car.position.x, w.position.z - car.position.z);
      if (state.inCar && dCar < 7 && state.speed > 30) {
        w.position.x += (w.position.x > car.position.x ? 1 : -1) * 4 * dt;
      } else {
        w.position.z += w.userData.dir * w.userData.speed * dt;
        if (w.position.z > 260) w.userData.dir = -1;
        if (w.position.z < -260) w.userData.dir = 1;
      }
      w.position.y = Math.abs(Math.sin(t * 6 + w.userData.phase)) * 0.05;
      w.rotation.y = w.userData.dir > 0 ? 0 : Math.PI;
    }
    // Police: pursue when wanted, patrol otherwise.
    if (state.wanted > 0 && !G.frozen) {
      police.forEach((u, i) => {
        u.visible = true;
        const tx = state.inCar ? car.position.x : player.position.x;
        const tz = state.inCar ? car.position.z : player.position.z;
        const dx = tx - u.position.x, dz = tz - u.position.z;
        const d = Math.hypot(dx, dz) || 1;
        const sp = 13 + i * 0.8;
        u.position.x += (dx / d) * sp * dt;
        u.position.z += (dz / d) * sp * dt;
        u.rotation.y = Math.atan2(dx, dz);
        u.userData.status = d < 8 ? 'RAMMING' : d < 30 ? 'PURSUIT' : 'RESPONDING';
      });
      heli.visible = state.wanted >= 3;
      if (heli.visible) {
        const hx = (state.inCar ? car.position.x : player.position.x) + Math.sin(t * 0.25) * 28;
        const hz = (state.inCar ? car.position.z : player.position.z) + Math.cos(t * 0.25) * 28;
        heli.position.set(hx, 32, hz);
        heli.lookAt(state.inCar ? car.position.x : player.position.x, 0, state.inCar ? car.position.z : player.position.z);
      }
    } else if (!G.frozen) {
      police.forEach((u) => { u.visible = false; });
      heli.visible = false;
    }
    // Fuel drains slowly while driving.
    if (state.inCar && Math.abs(drive.speed) > 1) state.fuel = Math.max(0, state.fuel - dt * 0.12);
  }

  // Camera.
  if (G.staged) {
    if (G.mode === 'chase34') {
      const cp = car.position, f = G.forward, r = G.right;
      camera.position.set(cp.x - f.x * 6.5 + r.x * 2.2, 2.7, cp.z - f.z * 6.5 + r.z * 2.2);
      camera.lookAt(cp.x + f.x * 5, 1.0, cp.z + f.z * 5);
    } else if (G.mode === 'foot') {
      // Camera behind the player along their facing, looking past them at
      // the fight: follows the staged facing (west for the mission shot),
      // not a fixed compass point.
      const f = { x: Math.sin(player.rotation.y), z: Math.cos(player.rotation.y) };
      camera.position.set(player.position.x - f.x * 6.5, 3.4, player.position.z - f.z * 6.5);
      camera.lookAt(player.position.x + f.x * 5, 1.8, player.position.z + f.z * 5);
    }
    // Staged frames keep the staged timer: elapsed frozen at the table value.
    state.elapsed = G.staged.elapsed;
  } else if (!state.started) {
    attract += dt * 0.05;
    camera.position.set(30 + Math.sin(attract) * 18, 16, 60 + Math.cos(attract) * 10);
    camera.lookAt(0, 3, -40);
  } else if (state.inCar) {
    const f = { x: Math.sin(drive.heading), z: Math.cos(drive.heading) };
    const r = { x: -Math.cos(drive.heading), z: Math.sin(drive.heading) };
    const tx = car.position.x - f.x * 6.5 + r.x * 2.2;
    const tz = car.position.z - f.z * 6.5 + r.z * 2.2;
    camera.position.lerp(new THREE.Vector3(tx, 2.7, tz), 0.12);
    camera.lookAt(car.position.x + f.x * 5, 1.0, car.position.z + f.z * 5);
  } else {
    const f = { x: Math.sin(player.rotation.y), z: Math.cos(player.rotation.y) };
    camera.position.lerp(new THREE.Vector3(player.position.x - f.x * 4.5, 2.2, player.position.z - f.z * 4.5), 0.15);
    camera.lookAt(player.position.x + f.x * 4, 1.3, player.position.z + f.z * 4);
  }

  // HUD context.
  const px = state.inCar ? car.position.x : player.position.x;
  const pz = state.inCar ? car.position.z : player.position.z;
  let policeRows = null;
  if (G.staged && G.staged.police) {
    policeRows = G.staged.police.map((row) => {
      if (row.call === 'AIR-1 SKY-1') return { call: row.call, d: row.d, status: row.status };
      const u = police.find((p) => p.userData.call === row.call);
      const d = u ? Math.round(Math.hypot(u.position.x - px, u.position.z - pz)) : row.d;
      return { call: row.call, d, status: row.status };
    });
  } else if (state.wanted > 0) {
    policeRows = police.filter((u) => u.visible).map((u) => ({
      call: u.userData.call,
      d: Math.round(Math.hypot(u.position.x - px, u.position.z - pz)),
      status: u.userData.status,
    }));
    if (heli.visible) policeRows.push({ call: 'AIR-1 SKY-1', d: Math.round(Math.hypot(heli.position.x - px, heli.position.z - pz)), status: 'SPOTLIGHT' });
  }
  const markerDist = Math.hypot(px - state.markerAt.x, pz - state.markerAt.z);
  updateHUD(state, {
    markerDist, displaySpeed: G.staged ? G.staged.speed : state.speed,
    policeRows, dialogue: G.dialogue, district: G.district, tod: G.tod, onFoot,
  });
  drawMinimap(document.getElementById('minimap').getContext('2d'), world,
    { x: px, z: pz }, police.filter((u) => u.visible).map((u) => ({ x: u.position.x, z: u.position.z })),
    state.loopDone ? null : { x: state.markerAt.x, z: state.markerAt.z });

  // Enemy health bars projected to screen.
  const v = new THREE.Vector3();
  for (const e of enemies) {
    if (!e.group.visible) { e.bar.style.display = 'none'; continue; }
    if (e.down) { e.bar.style.display = 'none'; continue; } // downed: body only, no bar
    v.set(e.group.position.x, 2.3, e.group.position.z).project(camera);
    if (v.z > 1) { e.bar.style.display = 'none'; continue; }
    e.bar.style.display = 'block';
    e.bar.style.left = ((v.x * 0.5 + 0.5) * innerWidth) + 'px';
    e.bar.style.top = ((-v.y * 0.5 + 0.5) * innerHeight) + 'px';
    e.bar.querySelector('i').style.width = e.hp + '%';
  }

  renderer.render(scene, camera);

  if (shotName && !shotReady && frames > 3) {
    shotReady = true;
    window.__heatline = { ready: true, staged: shotName, state: () => snapshot(), errors };
  }
}
function snapshot() {
  return {
    job: state.job, cash: state.cash, rep: state.rep, jobsDone: state.jobsDone,
    wanted: state.wanted, elapsed: Math.round(state.elapsed), par: state.par,
    speed: Math.round(G.staged ? G.staged.speed : state.speed),
    targetsDown: state.targetsDown, loopDone: state.loopDone, inCar: state.inCar,
  };
}
window.__heatline = { ready: false, staged: shotName, state: () => snapshot(), errors };

// Start: staged screenshot mode, or the live game behind the start screen.
if (shotName && STAGES[shotName]) {
  document.getElementById('start').style.display = 'none';
  state.started = true;
  applyShot(G, shotName);
  G.stageT0 = clock.elapsedTime;
} else if (shotName) {
  document.getElementById('start').style.display = 'none';
  state.started = true;
}
animate();
