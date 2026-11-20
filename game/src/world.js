// SUNCOAST: HEATLINE — world builder: sunset sky, ocean, beach, city, palms,
// ferris wheel, boardwalk kiosks and the container yard. All textures are
// procedural canvas textures made at runtime; nothing loads over the network.
import * as THREE from 'three';
import { mulberry32 } from './config.js';

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function windowTexture() {
  return canvasTexture(128, 256, (g, w, h) => {
    g.fillStyle = '#2a2118'; g.fillRect(0, 0, w, h);
    for (let y = 8; y < h - 10; y += 22) {
      for (let x = 8; x < w - 10; x += 18) {
        const lit = Math.random() < 0.62;
        g.fillStyle = lit ? (Math.random() < 0.8 ? '#ffd27a' : '#ffe9b0') : '#14100c';
        g.fillRect(x, y, 11, 13);
      }
    }
  });
}

function oceanTexture() {
  const t = canvasTexture(256, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1c5f8a'); grad.addColorStop(0.6, '#2a7fae'); grad.addColorStop(1, '#e8834a');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < 26; i++) {
      g.beginPath();
      const y = Math.random() * h;
      g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y + 3); g.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 10);
  return t;
}

function cloudTexture() {
  return canvasTexture(128, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (const [x, y, r, a] of [[34, 38, 20, .5], [58, 30, 24, .55], [86, 40, 18, .45], [58, 42, 26, .4]]) {
      const grad = g.createRadialGradient(x, y, 2, x, y, r);
      grad.addColorStop(0, `rgba(255,214,190,${a})`); grad.addColorStop(1, 'rgba(255,214,190,0)');
      g.fillStyle = grad; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
  });
}

export function buildWorld(scene) {
  const rnd = mulberry32(1);
  const out = { colliders: [], palms: [], trafficLanes: [], wheel: null, ocean: null, sun: null, marker: null };

  // Warm hemisphere + low sun from the west (over the ocean) so east faces
  // read as dark amber, never void black.
  scene.add(new THREE.HemisphereLight(0xffd9a8, 0x4a2c4a, 0.95));
  const sun = new THREE.DirectionalLight(0xffb36b, 1.9);
  sun.position.set(-120, 55, 40); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xff8f5e, 0.45);
  fill.position.set(80, 40, -60); scene.add(fill);

  // Sunset sky dome: gradient canvas wrapped on the inside of a sphere.
  const skyTex = canvasTexture(1024, 512, (g, w, h) => {
    const grad = g.createLinearGradient(0, h, 0, 0);
    grad.addColorStop(0, '#ff7a2e'); grad.addColorStop(0.35, '#e85a6a');
    grad.addColorStop(0.62, '#7a4a7d'); grad.addColorStop(1, '#2c2350');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(480, 24, 16),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }));
  scene.add(sky);

  // Sun disc with glow halo, low over the water to the west.
  const glowTex = canvasTexture(256, 256, (g) => {
    const grad = g.createRadialGradient(128, 128, 4, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255,240,200,1)'); grad.addColorStop(0.25, 'rgba(255,190,110,.85)');
    grad.addColorStop(0.6, 'rgba(255,120,60,.28)'); grad.addColorStop(1, 'rgba(255,120,60,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(150, 150),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, fog: false }));
  glow.position.set(-380, 42, -40); glow.lookAt(0, 42, -40); scene.add(glow);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(17, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff3cf, fog: false }));
  disc.position.set(-375, 42, -40); disc.lookAt(0, 42, -40); scene.add(disc);
  out.sun = disc;

  // Soft clouds: flattened translucent spheres with a radial-fade texture.
  const ct = cloudTexture();
  for (let i = 0; i < 12; i++) {
    const cl = new THREE.Mesh(new THREE.PlaneGeometry(90 + rnd() * 70, 22 + rnd() * 12),
      new THREE.MeshBasicMaterial({ map: ct, transparent: true, opacity: 0.55 + rnd() * 0.25, depthWrite: false, fog: false }));
    const ang = rnd() * Math.PI * 2, r = 260 + rnd() * 140;
    cl.position.set(Math.cos(ang) * r, 95 + rnd() * 55, Math.sin(ang) * r);
    cl.lookAt(0, cl.position.y, 0); scene.add(cl);
  }

  // Ocean (west, x < -14), animated by scrolling its texture.
  const oTex = oceanTexture();
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(420, 560),
    new THREE.MeshStandardMaterial({ map: oTex, roughness: 0.25, metalness: 0.35 }));
  ocean.rotation.x = -Math.PI / 2; ocean.position.set(-220, 0.1, 0); scene.add(ocean);
  out.ocean = ocean;

  // Sand strip + foam line.
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(26, 560),
    new THREE.MeshStandardMaterial({ color: 0xd9b380, roughness: 1 }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(-2, 0.12, 0); scene.add(sand);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 560),
    new THREE.MeshBasicMaterial({ color: 0xf5efe0, transparent: true, opacity: 0.55 }));
  foam.rotation.x = -Math.PI / 2; foam.position.set(-13.5, 0.2, 0); scene.add(foam);

  // Ground base for the city (east of the road).
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(560, 560),
    new THREE.MeshStandardMaterial({ color: 0x3d3a44, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(180, 0.05, 0); scene.add(ground);

  // Beachfront road (wet-look sheen) + downtown avenue.
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x23232c, roughness: 0.35, metalness: 0.25 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(12, 560), roadMat);
  road.rotation.x = -Math.PI / 2; road.position.set(8, 0.15, 0); scene.add(road);
  const ave = new THREE.Mesh(new THREE.PlaneGeometry(12, 300), roadMat);
  ave.rotation.x = -Math.PI / 2; ave.rotation.z = Math.PI / 2; ave.position.set(120, 0.15, 40); scene.add(ave);
  for (let z = -260; z < 270; z += 14) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 6),
      new THREE.MeshBasicMaterial({ color: 0xd8c25a }));
    dash.rotation.x = -Math.PI / 2; dash.position.set(8, 0.18, z); scene.add(dash);
  }
  out.trafficLanes = [4.5, 11.5];

  // City: 196 buildings, varied heights, footprints and warm palettes, lit windows.
  const winTex = windowTexture();
  const palettes = [0x8a6f5c, 0x6f7d8c, 0x9c7a5e, 0x5e6b7a, 0xb08a6a, 0x7a5e6e, 0x4e5e6a];
  let built = 0;
  for (let gx = 0; gx < 15 && built < 196; gx++) {
    for (let gz = 0; gz < 14 && built < 196; gz++) {
      const bx = 26 + gx * 20 + (rnd() - 0.5) * 5;
      const bz = -260 + gz * 40 + (rnd() - 0.5) * 6;
      if (Math.abs(bz - 40) < 12) continue; // keep the avenue clear
      if (bx > 118 && bx < 154 && bz > 128 && bz < 166) continue; // keep the container yard clear
      const w = 9 + rnd() * 7, d = 9 + rnd() * 7, h = 9 + rnd() * 58;
      const mat = new THREE.MeshStandardMaterial({
        color: palettes[Math.floor(rnd() * palettes.length)], roughness: 0.85,
        emissive: 0xffc46a, emissiveMap: winTex, emissiveIntensity: 0.55 });
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      b.position.set(bx, h / 2, bz); scene.add(b);
      out.colliders.push({ x: bx, z: bz, hw: w / 2 + 1, hd: d / 2 + 1 });
      built++;
      if (rnd() < 0.22) {
        const sign = new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, 1.2, 0.4),
          new THREE.MeshBasicMaterial({ color: rnd() < 0.5 ? 0xff5e7a : 0x4dd8ff }));
        sign.position.set(bx, h + 0.8, bz - d / 2 - 0.3); scene.add(sign);
      }
    }
  }

  // Leafy palms along the beach road and boardwalk: trunk + 7 drooping fronds.
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e5236, roughness: 1 });
  const frondMats = [0x2f7a3a, 0x3f9448, 0x27652f].map((c) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, side: THREE.DoubleSide }));
  function palm(x, z) {
    const g = new THREE.Group();
    const lean = (rnd() - 0.5) * 0.14;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 7 + rnd() * 2, 6), trunkMat);
    trunk.position.y = 3.5; trunk.rotation.z = lean; g.add(trunk);
    const topY = 7 + rnd() * 1.5;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + rnd() * 0.4;
      const fr = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.6), frondMats[i % 3]);
      fr.position.set(Math.cos(a) * 1.3, topY - 0.4, Math.sin(a) * 1.3);
      fr.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1 - 0.5);
      fr.rotation.y = -a; g.add(fr);
    }
    g.position.set(x, 0, z); scene.add(g); out.palms.push(g);
  }
  for (let z = -250; z <= 250; z += 16) { palm(-10.5, z + 4); if (z % 48 === 0) palm(15.5, z); }
  for (let z = -200; z <= 200; z += 40) palm(20, z + 20);

  // Boardwalk kiosks: pitched roof, sign board, warm interior light.
  const kioskNames = ['TACO TIDE', 'SUNSET SLUSH', 'PALM SODA', 'SURF SNACKS', 'CORAL CONES'];
  kioskNames.forEach((name, i) => {
    const z = -90 + i * 46;
    const k = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 4),
      new THREE.MeshStandardMaterial({ color: 0xf2e3c8, roughness: 0.8 }));
    body.position.y = 1.5; k.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 5),
      new THREE.MeshStandardMaterial({ color: i % 2 ? 0xd94f4f : 0x2e8f8a, roughness: 0.7 }));
    roof.position.y = 3.4; roof.rotation.z = 0.12; k.add(roof);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.9),
      new THREE.MeshBasicMaterial({ color: 0x1c1c26 }));
    sign.position.set(0, 2.6, 2.05); k.add(sign);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.6),
      new THREE.MeshBasicMaterial({ color: 0xffc46a }));
    glow.position.set(0, 1.2, 2.02); k.add(glow);
    const awn = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.15, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xffd27a }));
    awn.position.set(0, 2.9, 2.6); awn.rotation.x = 0.25; k.add(awn);
    k.position.set(17.5, 0, z); scene.add(k);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.7),
      new THREE.MeshBasicMaterial({ map: canvasTexture(256, 48, (g2) => {
        g2.fillStyle = '#1c1c26'; g2.fillRect(0, 0, 256, 48);
        g2.fillStyle = '#ffd27a'; g2.font = 'bold 26px Arial'; g2.textAlign = 'center';
        g2.fillText(name, 128, 34);
      }), transparent: true }));
    label.position.set(0, 2.6, 2.08); k.add(label);
  });

  // Ferris wheel on the boardwalk skyline: rim, spokes, gondolas, legs.
  const wheel = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(11, 0.5, 8, 40),
    new THREE.MeshStandardMaterial({ color: 0xd94f4f, roughness: 0.5, emissive: 0x881122, emissiveIntensity: 0.4 }));
  wheel.add(rim);
  for (let i = 0; i < 8; i++) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 22, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xf2f2f2 }));
    sp.rotation.z = (i / 8) * Math.PI; wheel.add(sp);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const gon = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6),
      new THREE.MeshStandardMaterial({ color: i % 2 ? 0xffd27a : 0x4dd8ff, emissive: 0x332200, emissiveIntensity: 0.5 }));
    gon.position.set(Math.cos(a) * 11, Math.sin(a) * 11, 0); wheel.add(gon);
  }
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 15, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xdddddd }));
  legL.position.set(-4, -7, 0); legL.rotation.z = 0.35; wheel.add(legL);
  const legR = legL.clone(); legR.position.x = 4; legR.rotation.z = -0.35; wheel.add(legR);
  wheel.position.set(24, 15, -120); scene.add(wheel);
  out.wheel = wheel;

  // Pier reaching into the ocean.
  const pier = new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 60),
    new THREE.MeshStandardMaterial({ color: 0x8a6f52, roughness: 1 }));
  pier.position.set(-20, 0.8, 60); scene.add(pier);

  // Lighthouse at the north end of the beach road.
  const lh = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3, 22, 12),
    new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.8 }));
  tower.position.y = 11; lh.add(tower);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 3, 12),
    new THREE.MeshStandardMaterial({ color: 0xd94f4f }));
  band.position.y = 14; lh.add(band);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
  lamp.position.y = 23; lh.add(lamp);
  lh.position.set(10, 0, -268); scene.add(lh);

  // Container yard (mission 4): stacked containers, crates, fencing.
  const yard = new THREE.Group();
  const contCols = [0xc94f3d, 0x3d7ac9, 0x4fae5e, 0xc9a13d, 0x7a5ec9];
  let ci = 0;
  for (const [x, z, stack] of [[128, 138, 2], [136, 138, 1], [144, 138, 2], [128, 148, 1], [144, 148, 3], [136, 156, 2], [128, 156, 1], [144, 156, 1]]) {
    for (let s = 0; s < stack; s++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(7, 2.6, 2.6),
        new THREE.MeshStandardMaterial({ color: contCols[ci++ % 5], roughness: 0.85 }));
      c.position.set(x, 1.3 + s * 2.6, z); yard.add(c);
    }
  }
  for (let i = 0; i < 8; i++) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x9a7a4a, roughness: 1 }));
    // Crates line the south strip (z 158..161), clear of the z 140..146
    // fight lane: random crates there occluded the yard enemies on camera.
    crate.position.set(124 + rnd() * 24, 0.8, 158 + rnd() * 3); crate.rotation.y = rnd(); yard.add(crate);
  }
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6, metalness: 0.5 });
  for (const [x, z, w, d] of [[136, 132, 26, 0.3], [136, 162, 26, 0.3], [122, 147, 0.3, 30], [150, 147, 0.3, 30]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, 2.4, d), fenceMat);
    f.position.set(x, 1.2, z); yard.add(f);
  }
  yard.position.set(0, 0, 0); scene.add(yard);
  out.yardCenter = new THREE.Vector3(136, 0, 147);

  // Mission marker: small glowing disc + modest vertical beam.
  const marker = new THREE.Group();
  const discM = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd94d, transparent: true, opacity: 0.85 }));
  discM.rotation.x = -Math.PI / 2; discM.position.y = 0.25; marker.add(discM);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 9, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd94d, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }));
  beam.position.y = 4.5; marker.add(beam);
  scene.add(marker);
  out.marker = marker;

  return out;
}
