// SUNCOAST: HEATLINE — vehicles: the HEATLINE GT hero car, traffic cars,
// SNOOK police units and the SKY-1 helicopter with its spotlight.
import * as THREE from 'three';
import { mulberry32 } from './config.js';

function bodyMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.65, ...opts });
}

export function buildHeroCar() {
  const car = new THREE.Group();
  const paint = bodyMat(0xb3121f);
  const glass = new THREE.MeshStandardMaterial({ color: 0x18242e, roughness: 0.08, metalness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x14141a, roughness: 0.7 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd8d8de, roughness: 0.2, metalness: 0.9 });

  // Low sloped hood, clearly lower than the cabin roofline.
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.28, 1.5), paint);
  hood.position.set(0, 0.72, 1.55); hood.rotation.x = -0.16; car.add(hood);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 0.5), paint);
  nose.position.set(0, 0.55, 2.25); car.add(nose);
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 0.1), dark);
  grille.position.set(0, 0.55, 2.52); car.add(grille);
  // Main body + cabin with raked reflective glass.
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 2.6), paint);
  body.position.set(0, 0.62, -0.35); car.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.5), glass);
  cabin.position.set(0, 1.08, -0.5); cabin.rotation.x = -0.12; car.add(cabin);
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.7, 0.08), glass);
  windshield.position.set(0, 1.02, 0.32); windshield.rotation.x = -0.62; car.add(windshield);
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.6, 0.08), glass);
  rearGlass.position.set(0, 1.0, -1.28); rearGlass.rotation.x = 0.62; car.add(rearGlass);
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 1.2), glass);
  sideL.position.set(-0.82, 1.05, -0.5); car.add(sideL);
  const sideR = sideL.clone(); sideR.position.x = 0.82; car.add(sideR);
  // Rear spoiler on short mounts, twin exhausts, emissive brake bar.
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.45), dark);
  spoiler.position.set(0, 1.18, -1.75); car.add(spoiler);
  for (const x of [-0.5, 0.5]) {
    const mount = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), dark);
    mount.position.set(x, 1.0, -1.75); car.add(mount);
  }
  for (const x of [-0.55, 0.55]) {
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.25, 10), chrome);
    ex.rotation.x = Math.PI / 2; ex.position.set(x, 0.32, -1.95); car.add(ex);
  }
  const brakeMat = new THREE.MeshStandardMaterial({ color: 0xaa0000, emissive: 0xff1a1a, emissiveIntensity: 1.6 });
  const brake = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.16, 0.08), brakeMat);
  brake.position.set(0, 0.85, -1.78); car.add(brake);
  car.userData.brakeMat = brakeMat;
  // Headlights.
  for (const x of [-0.65, 0.65]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xfff6c8, emissive: 0xffe9a0, emissiveIntensity: 1.2 }));
    hl.position.set(x, 0.68, 2.52); car.add(hl);
  }
  // Flared arches (torus segments) + real wheels with rims.
  const wheels = [];
  for (const [x, z] of [[-0.95, 1.45], [0.95, 1.45], [-0.95, -1.25], [0.95, -1.25]]) {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.1, 8, 14, Math.PI), paint);
    arch.position.set(x, 0.48, z); arch.rotation.y = Math.PI / 2; arch.rotation.z = 0; car.add(arch);
    const wg = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16), dark);
    tire.rotation.z = Math.PI / 2; wg.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 10), chrome);
    rim.rotation.z = Math.PI / 2; wg.add(rim);
    wg.position.set(x, 0.38, z); car.add(wg); wheels.push(wg);
  }
  car.userData.wheels = wheels;
  // Driver: torso + helmet, readable through the glass.
  const driver = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x2e5e8c }));
  torso.position.y = 0.25; driver.add(torso);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.3 }));
  helmet.position.y = 0.68; driver.add(helmet);
  driver.position.set(-0.35, 0.85, -0.5); car.add(driver);
  return car;
}

function simpleCar(color) {
  const g = new THREE.Group();
  const m = bodyMat(color);
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 3.6), m);
  b.position.y = 0.6; g.add(b);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x1a222c, roughness: 0.15, metalness: 0.8 }));
  cab.position.set(0, 1.1, -0.2); g.add(cab);
  for (const [x, z] of [[-0.85, 1.2], [0.85, 1.2], [-0.85, -1.2], [0.85, -1.2]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 12),
      new THREE.MeshStandardMaterial({ color: 0x111111 }));
    w.rotation.z = Math.PI / 2; w.position.set(x, 0.34, z); g.add(w);
  }
  for (const x of [-0.6, 0.6]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffe9a0, emissiveIntensity: 1.4 }));
    hl.position.set(x, 0.62, 1.83); g.add(hl);
  }
  return g;
}

export function buildTraffic(scene) {
  const rnd = mulberry32(7);
  const colors = [0x3d7ac9, 0xc9a13d, 0x4fae5e, 0xd8d8d8, 0x7a5ec9, 0xc96a3d, 0x2e8f8a, 0x888888];
  const cars = [];
  for (let i = 0; i < 18; i++) {
    const c = simpleCar(colors[i % colors.length]);
    const lane = i % 2 === 0 ? 4.5 : 11.5;
    const dir = i % 4 < 2 ? 1 : -1;
    c.position.set(lane, 0, -260 + rnd() * 520);
    c.rotation.y = dir > 0 ? Math.PI : 0;
    c.userData = { lane, dir, speed: 9 + rnd() * 7 };
    scene.add(c); cars.push(c);
  }
  return cars;
}

export function buildPolice(scene) {
  const units = [];
  const calls = ['SNOOK-12', 'SNOOK-11', 'SNOOK-13', 'SNOOK-14'];
  for (let i = 0; i < 4; i++) {
    const c = simpleCar(0x1a1a22);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x2244ff, emissive: 0x3355ff, emissiveIntensity: 1.8 }));
    bar.position.set(0, 1.5, -0.2); c.add(bar);
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 1.8 }));
    bar2.position.set(0.4, 1.5, -0.2); c.add(bar2);
    c.userData = { call: calls[i], status: 'RESPONDING' };
    scene.add(c); units.push(c);
  }
  return units;
}

export function buildHeli(scene) {
  const heli = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x22242e, roughness: 0.5, metalness: 0.4 }));
  heli.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.2, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.1, metalness: 0.8 }));
  cabin.position.set(0, 0.1, 1.4); heli.add(cabin);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 4.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x22242e }));
  boom.rotation.x = Math.PI / 2; boom.position.set(0, 0.3, -3.8); heli.add(boom);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x22242e }));
  tail.position.set(0, 0.8, -5.8); heli.add(tail);
  const rotor = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.06, 24),
    new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.28 }));
  rotor.add(disc);
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 9),
      new THREE.MeshStandardMaterial({ color: 0x111111 }));
    blade.rotation.y = (i / 4) * Math.PI; rotor.add(blade);
  }
  rotor.position.y = 1.1; heli.add(rotor);
  for (const x of [-1.05, 1.05]) {
    const skid = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 3.4),
      new THREE.MeshStandardMaterial({ color: 0x111111 }));
    skid.position.set(x, -1.0, 0); heli.add(skid);
  }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff6c8 }));
  lamp.position.set(0, -0.9, 1.6); heli.add(lamp);
  // Spotlight cone + bright pool on the road.
  const cone = new THREE.Mesh(new THREE.ConeGeometry(5.5, 30, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
  cone.position.set(0, -15.5, 1.6); cone.rotation.x = Math.PI; heli.add(cone);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(5.5, 24),
    new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.5, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, -30.5, 1.6); heli.add(pool);
  heli.userData = { rotor, cone, pool };
  scene.add(heli);
  return heli;
}
