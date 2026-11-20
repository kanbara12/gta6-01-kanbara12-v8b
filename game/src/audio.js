// SUNCOAST: HEATLINE — audio: everything synthesised live with WebAudio.
// Engine hum, gunfire, impacts and three original synth radio stations.
// No audio files, no network. All calls are guarded: headless runs stay silent.
export function createAudio() {
  const api = { muted: false, station: 0, engine: null, ctx: null };
  function ensure() {
    if (api.ctx) return api.ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      api.ctx = new AC();
      const osc = api.ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 55;
      const gain = api.ctx.createGain(); gain.gain.value = 0.0;
      const filt = api.ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 320;
      osc.connect(filt); filt.connect(gain); gain.connect(api.ctx.destination);
      osc.start(); api.engine = { osc, gain };
      startStation();
    } catch (e) { api.ctx = null; }
    return api.ctx;
  }
  let stationTimer = null;
  const SCALES = [[0, 3, 5, 7, 10], [0, 2, 4, 7, 9], [0, 3, 5, 8, 10]];
  function startStation() {
    if (stationTimer || !api.ctx) return;
    let step = 0;
    stationTimer = setInterval(() => {
      if (api.muted || !api.ctx) return;
      try {
        const scale = SCALES[api.station % 3];
        const note = 220 * Math.pow(2, scale[step % scale.length] / 12);
        const o = api.ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = note;
        const g = api.ctx.createGain();
        g.gain.setValueAtTime(0.05, api.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, api.ctx.currentTime + 0.5);
        o.connect(g); g.connect(api.ctx.destination);
        o.start(); o.stop(api.ctx.currentTime + 0.55);
        step++;
      } catch (e) { /* silent in headless */ }
    }, 320);
  }
  api.unlock = () => { ensure(); if (api.ctx && api.ctx.resume) api.ctx.resume().catch(() => {}); };
  api.setSpeed = ( kmh ) => {
    if (!api.engine || api.muted) return;
    try {
      api.engine.osc.frequency.value = 50 + kmh * 1.1;
      api.engine.gain.gain.value = kmh > 2 ? 0.035 : 0.012;
    } catch (e) {}
  };
  api.shot = () => {
    if (!ensure() || api.muted) return;
    try {
      const len = 0.14, buf = api.ctx.createBuffer(1, api.ctx.sampleRate * len, api.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = api.ctx.createBufferSource(); src.buffer = buf;
      const g = api.ctx.createGain(); g.gain.value = 0.25;
      src.connect(g); g.connect(api.ctx.destination); src.start();
    } catch (e) {}
  };
  api.beep = () => {
    if (!ensure() || api.muted) return;
    try {
      const o = api.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 880;
      const g = api.ctx.createGain(); g.gain.setValueAtTime(0.08, api.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, api.ctx.currentTime + 0.18);
      o.connect(g); g.connect(api.ctx.destination); o.start(); o.stop(api.ctx.currentTime + 0.2);
    } catch (e) {}
  };
  api.setStation = (n) => { api.station = n; };
  api.toggleMute = () => {
    api.muted = !api.muted;
    if (api.engine) { try { api.engine.gain.gain.value = 0; } catch (e) {} }
    return api.muted;
  };
  return api;
}
