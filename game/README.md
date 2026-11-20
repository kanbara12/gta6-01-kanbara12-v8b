# SUNCOAST: HEATLINE game notes

A complete open-world crime game that runs from plain static files. Open
`index.html` in desktop Chrome. Nothing loads over the network: Three.js
v0.160.0 is vendored in `vendor/`, textures are drawn on canvas at runtime,
and all audio is synthesised live with WebAudio.

## How it plays

You wake up on the Suncoast with $1,250 and a red HEATLINE GT. Rae, the
fixer, has eight contracts for you. Drive to the glowing marker to take each
job; finish it and the cash, REP and jobs-done count move together. The heat
follows your actions: quiet jobs stay clean, the yard sweep and the garage run
bring SNOOK units and the SKY-1 helicopter with its spotlight. Drift chains
pay $150, near misses $50, street stashes $250. Lose the heat with a garage
repaint, heal at the safehouse, and close the loop at the north lighthouse
for $22,450.

Controls: W A S D drive, Space drift, E enter/exit the car, mouse click to
shoot on foot, 1–4 weapons, Z/X/C crew calls, R radio, M mute, H hide HUD,
P pause (stats, save, load).

## Source outline

- `src/config.js` — constants, the 8-mission economy, the staged screenshot values
- `src/world.js` — sunset sky and sun disc, animated ocean, beach, 196 buildings, leafy palms, ferris wheel, kiosks, pier, lighthouse, container yard
- `src/vehicles.js` — HEATLINE GT (sloped hood, raked glass, arches, spoiler, exhausts, brake lights, driver), 18 traffic cars, SNOOK police units, SKY-1 helicopter with spotlight cone and pool
- `src/missions.js` — one consistent mission state; payouts, REP and wanted move together
- `src/hud.js` — mission panel, money panel, named police panel, radio/weapons/crew, speedometer, round minimap, dialogue cards, score popups, pause stats
- `src/audio.js` — synthesised engine hum, gunfire, UI beeps, three original radio stations
- `src/shots.js` — `?shot=start|play|chase|mission|end` staging (seed 1)
- `src/main.js` — boot, game loop, arcade driving, on-foot combat, chase camera, pedestrians, police pursuit, heli orbit

## Screenshots

`shots.json` lists the four submitted frames. The fifth scene, `?shot=end`
(the loop complete at the lighthouse, $22,450, 8 jobs done, player and car
both in frame), is prepared in-game but not submitted — the kit caps
`screenshots/` at four files.

## Third-party notices

Three.js v0.160.0 (MIT). See `THIRD-PARTY-NOTICES.md` and
`vendor/LICENSE-threejs.txt`. No other third-party code, images, fonts or
audio is used.
