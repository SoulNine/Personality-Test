// Drifting light motes (canvas 2D) and an optional generated ambient sound (Web Audio, no files).

export function startMotes(canvas) {
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let w, h, motes = [], raf = 0, last = 0;
  // pre-rendered glow sprite
  const sprite = document.createElement("canvas"); sprite.width = sprite.height = 32;
  const s = sprite.getContext("2d"), g = s.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(235,252,255,1)"); g.addColorStop(0.25, "rgba(190,240,245,0.55)"); g.addColorStop(1, "rgba(190,240,245,0)");
  s.fillStyle = g; s.fillRect(0, 0, 32, 32);

  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.max(24, Math.min(70, Math.round((w * h) / 18000)));
    motes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: 3 + Math.random() * 9,
      vy: 4 + Math.random() * 10, ph: Math.random() * 6.28, sp: 0.3 + Math.random() * 0.7, a: 0.25 + Math.random() * 0.55,
    }));
    if (reduced) draw(0);
  }
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (const m of motes) {
      const tw = 0.6 + 0.4 * Math.sin(t * 0.001 * m.sp + m.ph);
      ctx.globalAlpha = m.a * tw;
      ctx.drawImage(sprite, m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
    }
    ctx.globalAlpha = 1;
  }
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    for (const m of motes) {
      m.y -= m.vy * dt; m.x += Math.sin(t * 0.0004 * m.sp + m.ph) * 6 * dt;
      if (m.y < -20) { m.y = h + 20; m.x = Math.random() * w; }
    }
    draw(t);
    raf = requestAnimationFrame(frame);
  }
  window.addEventListener("resize", resize);
  resize();
  if (!reduced) {
    raf = requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
  }
}

// Soft drone + wind, generated live. Starts only after a user click (browser rule).
export function createAmbient() {
  let ac = null, master = null, on = false;
  function build() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; lp.connect(master);
    [[110, "sine", 0.32], [164.81, "sine", 0.18], [220.5, "triangle", 0.06], [329.6, "sine", 0.04]].forEach(([f, type, gain], i) => {
      const o = ac.createOscillator(), gn = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      o.type = type; o.frequency.value = f; gn.gain.value = gain;
      lfo.frequency.value = 0.05 + i * 0.03; lg.gain.value = gain * 0.5; lfo.connect(lg); lg.connect(gn.gain);
      o.connect(gn); gn.connect(lp); o.start(); lfo.start();
    });
    // wind: filtered noise with a slowly moving band
    const len = ac.sampleRate * 4, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    let b0 = 0; for (let i = 0; i < len; i++) { b0 = 0.98 * b0 + 0.02 * (Math.random() * 2 - 1); d[i] = b0 * 3; }
    const noise = ac.createBufferSource(); noise.buffer = buf; noise.loop = true;
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 500; bp.Q.value = 0.7;
    const wl = ac.createOscillator(), wg = ac.createGain(); wl.frequency.value = 0.07; wg.gain.value = 300; wl.connect(wg); wg.connect(bp.frequency);
    const ng = ac.createGain(); ng.gain.value = 0.35;
    noise.connect(bp); bp.connect(ng); ng.connect(master); noise.start(); wl.start();
  }
  return {
    get on() { return on; },
    toggle() {
      if (!ac) build();
      on = !on;
      if (ac.state === "suspended") ac.resume();
      const now = ac.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(on ? 0.12 : 0, now + (on ? 2.5 : 0.8));
      return on;
    },
  };
}
