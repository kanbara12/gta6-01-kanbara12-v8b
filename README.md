# SUNCOAST: HEATLINE

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Three.js 0.160.0](https://img.shields.io/badge/Three.js-0.160.0-blue.svg)](./game/vendor/three.module.min.js)
[![make.fun gta6-01](https://img.shields.io/badge/make.fun-gta6--01-orange.svg)](https://make.fun)

An open-world crime game set on the Suncoast, a beach city with a
boardwalk, a ferris wheel, downtown avenues and an industrial yard. You start
with $1,250 and a red HEATLINE GT. Eight contracts stand between you and the
$22,450 loop: grab cargo, dodge SNOOK units, lose the SKY-1 helicopter, and
settle the yard crew's debt.

## Play

Open `game/index.html` in desktop Chrome (or run `node serve.ts` and visit
http://localhost:8080). No network needed: Three.js is vendored locally and
every texture and sound is made at runtime. Keyboard and mouse:

- **W A S D** drive, **Space** drift, **E** enter / exit the car
- **Mouse click** shoot (on foot), **1–4** switch weapons
- **Z / X / C** crew calls (Rae, Sable, Marlo), **R** radio, **M** mute
- **H** hide the HUD, **P** pause (stats, save, load)

## The loop: 8 jobs, $22,450

| # | Job | Pays | Cash after |
|---|---|---|---|
| 1 | A FAVOR IN THE HEAT | $2,500 | $3,750 |
| 2 | LOOSE CARGO | $2,500 | $6,250 |
| 3 | THE QUIET EXIT | $3,000 | $9,250 |
| 4 | STREET SWEEP (+$450 yard bounties) | $3,500 | $13,200 |
| 5 | NO WITNESSES | $4,250 | $17,450 |
| 6 | LAST LIGHT | $2,000 | $19,450 |
| 7 | THE MARINA SWAP | $1,500 | $20,950 |
| 8 | NORTH LIGHT | $1,500 | **$22,450** |

Story payouts total $19,750; with the $1,250 start cash and $450 of yard
bounties the loop closes at exactly $22,450. Side cash pays too: street
stashes $250, drift chains $150, near misses $50.

## Screenshots

Four genuine gameplay frames, each staged from the same live build
(`shots.json`, seed 1):

1. `1-start.jpg` — wide sunset establishing shot, beachfront, JOB 1/8, $1,250
2. `2-play.jpg` — low rear three-quarter beach-road chase, JOB 2/8, $3,750
3. `3-chase.jpg` — dusk downtown pursuit under SKY-1, JOB 5/8, $13,200
4. `4-mission.jpg` — on-foot container-yard sweep, JOB 4/8, $9,550

A fifth scene, the loop end at the north lighthouse ($22,450, LOOP COMPLETE),
is prepared in-game (`?shot=end`) and documented in `game/README.md`; the kit
caps `screenshots/` at four files, so it is not submitted.

## Structure

- `game/index.html` — page + HUD layout
- `game/src/config.js` — economy, staging tables, constants
- `game/src/world.js` — sky, ocean, beach, city, palms, ferris wheel, yard
- `game/src/vehicles.js` — HEATLINE GT, traffic, police, SKY-1 helicopter
- `game/src/missions.js` — mission state and payouts
- `game/src/hud.js` — HUD panels, police list, minimap, pause stats
- `game/src/audio.js` — synthesised engine, gunfire and radio
- `game/src/shots.js` — `?shot=` staging for the five scenes
- `game/src/main.js` — boot, loop, driving, combat, camera

Three.js v0.160.0 is vendored under `game/vendor/` with its licence; see
`game/THIRD-PARTY-NOTICES.md`. Everything else is original work for this
competition — no assets, names or music from any commercial game.

## Licence

MIT. See `LICENSE`.
