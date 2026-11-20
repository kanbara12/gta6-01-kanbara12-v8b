// SUNCOAST: HEATLINE — shared constants, economy and shot staging tables.
// All money, REP and timer values are the single source of truth for the HUD,
// the pause menu, the READMEs and the staged screenshots.

export const START_CASH = 1250;
export const LOOP_TOTAL = 22450;

export const MISSIONS = [
  { n: 1, title: 'A FAVOR IN THE HEAT', pay: 2500, objective: 'Meet the fixer Rae at the glowing marker.', next: 'LOOSE CARGO', par: 60, wanted: 0 },
  { n: 2, title: 'LOOSE CARGO', pay: 2500, objective: 'Pick up the sealed package at the next marker.', next: 'THE QUIET EXIT', par: 90, wanted: 0 },
  { n: 3, title: 'THE QUIET EXIT', pay: 3000, objective: 'Deliver the package across town. Keep it quiet.', next: 'STREET SWEEP', par: 150, wanted: 0 },
  { n: 4, title: 'STREET SWEEP', pay: 3500, objective: 'Clear the hostile crew in the industrial yard.', next: 'NO WITNESSES', par: 180, wanted: 2 },
  { n: 5, title: 'NO WITNESSES', pay: 4250, objective: 'Reach the garage and lose the heat.', next: 'LAST LIGHT', par: 150, wanted: 3 },
  { n: 6, title: 'LAST LIGHT', pay: 2000, objective: 'Final run at dusk. Police roadblocks ahead.', next: 'THE MARINA SWAP', par: 150, wanted: 4 },
  { n: 7, title: 'THE MARINA SWAP', pay: 1500, objective: 'Swap the case at the marina dock.', next: 'NORTH LIGHT', par: 120, wanted: 1 },
  { n: 8, title: 'NORTH LIGHT', pay: 1500, objective: 'North-beach run to the lighthouse. Close the loop.', next: '—', par: 120, wanted: 1 },
];

// Cumulative cash after each mission's payout (start $1,250 + payouts + yard bounties).
export const CASH_AFTER = [3750, 6250, 9250, 13200, 17450, 19450, 20950, 22450];
// REP after each mission completes: +1 per job, +1 extra for the yard sweep, +2 for the final run.
export const REP_AFTER = [1, 2, 3, 5, 6, 7, 8, 10];
export const YARD_BOUNTY = 150;

export const RADIO = [
  { name: 'SHORELINE 96.7', track: 'Sunset Run' },
  { name: 'PIER 102.5', track: 'Boardwalk Lights' },
  { name: 'DUNE 89.9', track: 'Night Palms' },
];

export const WEAPONS = ['PISTOL', 'SMG', 'SHOTGUN', 'BAT'];

// Exact staged values for every screenshot. Cash/REP/jobs/wanted/timer/speed are
// set together per shot — a frame is never accepted with mismatched values.
export const STAGES = {
  start: {
    job: 1, cash: 1250, rep: 0, jobsDone: 0, wanted: 0, elapsed: 47, par: 60,
    speed: 128, fuel: 92, cond: 100, district: 'BEACHFRONT • Beachfront Rd',
    tod: 'GOLDEN', dialogue: null, targets: null, drift: null, onFoot: false,
    mode: 'wide', camNote: 'wide high establishing',
  },
  play: {
    job: 2, cash: 3750, rep: 1, jobsDone: 1, wanted: 2, elapsed: 72, par: 90,
    speed: 141, fuel: 84, cond: 96, district: 'BEACHFRONT • Beachfront Rd',
    tod: 'GOLDEN', dialogue: { who: 'Rae — Fixer', init: 'R', text: 'Marker’s hot, Heatline. Grab the cargo and don’t stop for anyone.' },
    targets: null, drift: null, onFoot: false, mode: 'chase34',
    police: [
      { call: 'SNOOK-12', d: 6, status: 'RAMMING' },
      { call: 'SNOOK-11', d: 14, status: 'PURSUIT' },
      { call: 'SNOOK-13', d: 38, status: 'RESPONDING' },
      { call: 'SNOOK-14', d: 55, status: 'RESPONDING' },
    ],
  },
  chase: {
    job: 5, cash: 13200, rep: 5, jobsDone: 4, wanted: 3, elapsed: 129, par: 150,
    speed: 152, fuel: 61, cond: 88, district: 'DOWNTOWN • Ocean Dr',
    tod: 'DUSK', dialogue: { who: 'Sable — Lookout', init: 'S', text: 'Air unit’s on you. Break line of sight through downtown — now.' },
    targets: null, drift: 'DRIFT x3 +$150', onFoot: false, mode: 'chase34',
    police: [
      { call: 'SNOOK-21', d: 5, status: 'RAMMING' },
      { call: 'SNOOK-22', d: 11, status: 'PURSUIT' },
      { call: 'SNOOK-23', d: 27, status: 'FLANKING' },
      { call: 'SNOOK-24', d: 44, status: 'ROADBLOCK' },
      { call: 'AIR-1 SKY-1', d: 42, status: 'SPOTLIGHT' },
    ],
  },
  mission: {
    job: 4, cash: 9550, rep: 4, jobsDone: 3, wanted: 2, elapsed: 151, par: 180,
    speed: 0, fuel: 70, cond: 91, district: 'INDUSTRIAL YARD • Container Row',
    tod: 'DUSK', dialogue: { who: 'Marlo — Driver', init: 'M', text: 'The yard crew skimmed our cut. I keep the engine running — you handle the yard.' },
    targets: { down: 2, total: 3 }, drift: null, onFoot: true, mode: 'foot',
  },
  end: {
    job: 8, cash: 22450, rep: 10, jobsDone: 8, wanted: 0, elapsed: 0, par: 120,
    speed: 0, fuel: 55, cond: 94, district: 'NORTH BEACH • Lighthouse Rd',
    tod: 'GOLDEN', dialogue: { who: 'Rae — Fixer', init: 'R', text: 'That’s the whole loop, Heatline. $22,450 — the Suncoast is yours.' },
    targets: null, drift: null, onFoot: false, mode: 'wide',
    loopComplete: true,
  },
};

export function fmtMoney(n) { return '$' + n.toLocaleString('en-US'); }
export function fmtClock(s) {
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return m + ':' + String(r).padStart(2, '0');
}
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
