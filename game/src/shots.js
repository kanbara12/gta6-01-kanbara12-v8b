// SUNCOAST: HEATLINE — shot staging: each ?shot= scene sets mission state,
// positions, camera, police, heli, traffic and dialogue together from the
// STAGES table, then freezes the economy so the captured frame stays exact.
import { STAGES } from './config.js';
import { showPopup } from './hud.js';

function placeAtDist(G, obj, dist, lat, forward) {
  const fwd = Math.sqrt(Math.max(1, dist * dist - lat * lat));
  obj.position.set(
    G.car.position.x + forward.x * fwd + G.right.x * lat,
    obj.position.y,
    G.car.position.z + forward.z * fwd + G.right.z * lat);
  obj.rotation.y = G.car.rotation.y;
}

export function applyShot(G, name) {
  const s = STAGES[name];
  if (!s) return false;
  const st = G.state;
  st.job = s.job; st.cash = s.cash; st.rep = s.rep; st.jobsDone = s.jobsDone;
  st.wanted = s.wanted; st.elapsed = s.elapsed; st.par = s.par;
  st.fuel = s.fuel; st.cond = s.cond; st.loopDone = !!s.loopComplete;
  st.targetsDown = s.targets ? s.targets.down : 0;
  st.inCar = !s.onFoot; st.started = true;
  G.staged = s; G.frozen = true; G.mode = s.mode;
  G.dialogue = s.dialogue || null;
  G.driftSticky = s.drift || null;
  G.district = s.district; G.tod = s.tod;
  const fwd = { x: 0, z: -1 }; // north along the beach road
  G.forward = fwd; G.right = { x: 1, z: 0 };

  // Reset dynamic actors.
  G.heli.visible = false;
  G.police.forEach((u) => { u.visible = false; });
  G.enemies.forEach((e) => { e.group.visible = false; });
  G.flash.visible = false; G.flashFrozen = false;

  if (name === 'start') {
    G.car.position.set(8, 0, -80); G.car.rotation.y = Math.PI;
    G.car.visible = true; G.player.visible = false;
    // Wide high establishing from over the ocean: foreground water + sand,
    // road + car mid-frame, kiosks and the ferris wheel clear of buildings.
    G.camera.position.set(-30, 20, -55);
    G.camera.lookAt(16, 2, -100);
    G.marker.position.set(8, 0, -125);
    G.wheelSpin = true;
  } else if (name === 'play' || name === 'chase') {
    if (name === 'play') {
      G.car.position.set(8, 0, 40); G.car.rotation.y = Math.PI;
      G.marker.position.set(8, 0, -120);
    } else {
      G.car.position.set(60, 0, 40); G.car.rotation.y = -Math.PI / 2; // west on the avenue
      G.forward = { x: -1, z: 0 }; G.right = { x: 0, z: -1 };
      G.marker.position.set(-120, 0, 40);
      // Roadblock ahead: two police cars across the avenue.
      placeAtDist(G, G.police[3], 44, -3, G.forward);
      G.police[3].visible = true;
    }
    G.car.visible = true; G.player.visible = false;
    // Low close rear 3/4 chase camera: 6.5 m behind, 2.7 m high, 2.2 m to the side.
    const cp = G.car.position, f = G.forward, r = G.right;
    G.camera.position.set(cp.x - f.x * 6.5 + r.x * 2.2, 2.7, cp.z - f.z * 6.5 + r.z * 2.2);
    G.camera.lookAt(cp.x + f.x * 5, 1.0, cp.z + f.z * 5);
    // Police placed at the table's exact distances (horizontal metres).
    const rows = s.police;
    rows.forEach((row, i) => {
      if (row.call === 'AIR-1 SKY-1') return;
      const lat = [3, -3, 2.5, -2.5][i] || 0;
      placeAtDist(G, G.police[i], row.d, lat, f);
      G.police[i].visible = true;
      G.police[i].userData.status = row.status;
      G.police[i].userData.call = row.call;
    });
    // SKY-1 large in the upper sky with cone + pool, never clipped:
    // y=18 keeps the rotor inside the chase camera's top edge.
    // Play shot: heli dead ahead over the road centre so the pool lands
    // visibly on the road; chase keeps the offset orbit (QA-passed).
    const heliDist = 42, heliLat = name === 'play' ? 0 : 6;
    const hFwd = Math.sqrt(Math.max(1, heliDist * heliDist - heliLat * heliLat));
    G.heli.position.set(cp.x + f.x * hFwd - r.x * heliLat, 18, cp.z + f.z * hFwd - r.z * heliLat);
    G.heli.visible = true;
    // Traffic close by on the beach road / avenue.
    G.traffic[0].position.set(cp.x + f.x * 22 + r.x * -3, 0, cp.z + f.z * 22 + r.z * -3);
    G.traffic[0].rotation.y = G.car.rotation.y; G.traffic[0].visible = true;
    G.traffic[1].position.set(cp.x + f.x * 36 + r.x * 3, 0, cp.z + f.z * 36 + r.z * 3);
    G.traffic[1].rotation.y = G.car.rotation.y; G.traffic[1].visible = true;
    G.traffic[2].position.set(cp.x + f.x * 12 + r.x * 4.5, 0, cp.z + f.z * 12 + r.z * 4.5);
    G.traffic[2].rotation.y = G.car.rotation.y; G.traffic[2].visible = true;
    if (s.drift) showPopup(s.drift, true);
  } else if (name === 'mission') {
    // On foot in the container yard, facing WEST into the sunset: player
    // east of the fight lane, camera behind the player (east) looking west,
    // so the sunset sky + glow over the city read behind the enemies.
    // 1 LIVE enemy (health bar) + 2 DOWNED (no bar, bodies on the ground)
    // so TARGETS 2/3 matches the frame: 2 eliminated, 1 standing.
    G.player.position.set(140, 0, 144.5); G.player.rotation.y = -Math.PI / 2; // face west
    G.player.visible = true; G.car.visible = false;
    G.forward = { x: -1, z: 0 }; G.right = { x: 0, z: 1 };
    G.camera.position.set(146.5, 3.0, 144.5);
    G.camera.lookAt(135, 1.0, 144.5);
    const spots = [[130.5, 140.5, 0, true], [132, 143, 100, false], [131, 145.0, 0, true]];
    G.enemies.forEach((e, i) => {
      const [x, z, hp, down] = spots[i];
      e.group.position.set(x, 0, z);
      e.group.visible = true;
      e.hp = hp; e.down = down;
      e.group.rotation.z = down ? Math.PI / 2 : 0;
      e.group.rotation.y = Math.PI / 2; // face east, toward the player
    });
    // Pistol in hand + frozen muzzle flash starburst at the barrel tip.
    G.flash.visible = true; G.flashFrozen = true;
    G.marker.position.set(136, 0, 140);
  } else if (name === 'end') {
    G.car.position.set(10, 0, -250); G.car.rotation.y = Math.PI * 0.85;
    G.car.visible = true;
    G.player.position.set(6.5, 0, -246); G.player.rotation.y = Math.PI * 0.7;
    G.player.visible = true;
    G.camera.position.set(34, 12, -216);
    G.camera.lookAt(4, 3, -258);
    G.marker.position.set(10, 0, -262);
  }
  G.stagedName = name;
  return true;
}
