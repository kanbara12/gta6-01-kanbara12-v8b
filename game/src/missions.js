// SUNCOAST: HEATLINE — mission state: one consistent state object. Advancing a
// mission sets job, cash, REP, jobs done, wanted and timer together — never the
// mission index alone.
import { MISSIONS, CASH_AFTER, REP_AFTER, START_CASH, YARD_BOUNTY } from './config.js';

export function freshState() {
  return {
    job: 1, cash: START_CASH, rep: 0, jobsDone: 0, wanted: 0,
    elapsed: 0, par: MISSIONS[0].par, speed: 0, fuel: 92, cond: 100,
    hp: 100, targetsDown: 0, driftEarned: 0, nearMissEarned: 0,
    inCar: false, started: false, paused: false, loopDone: false,
    weapon: 0, radio: 0, muted: false,
    markerAt: { x: 8, z: -5 }, // mission-1 marker, ~45 m ahead of the car spawn
  };
}

export function missionOf(state) { return MISSIONS[state.job - 1]; }

// Complete the current mission: payout, REP, jobs done, wanted for the next job.
export function completeMission(state, extraBounty = 0) {
  const m = missionOf(state);
  state.cash += m.pay + extraBounty;
  state.jobsDone += 1;
  state.rep = REP_AFTER[state.job - 1];
  if (state.job >= 8) {
    state.loopDone = true; state.job = 8; state.wanted = 0;
    state.elapsed = 0;
    return { done: true, pay: m.pay + extraBounty };
  }
  state.job += 1;
  state.wanted = MISSIONS[state.job - 1].wanted;
  state.par = MISSIONS[state.job - 1].par;
  state.elapsed = 0;
  return { done: false, pay: m.pay + extraBounty };
}

// Yard sweep bounty: $150 per target, three targets.
export function yardBounty(state) { return state.targetsDown * YARD_BOUNTY; }

export function cashShouldBe(job) { return CASH_AFTER[job - 1]; }
