// Plays real hands (animations on) and checks each sound fires when it should; then records each sound to a WAV.
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname;
const isChip = l => /^(5|25|100|500|1K|5K|25K|100K)$/.test(l);
(async () => { const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 797 }, isMobile: true, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
  await p.route(/fonts/, r => r.abort()); await p.goto('file://' + dir + '/snd-page.html'); await p.waitForTimeout(1600); await p.click('#bankStart');
  const counts = () => p.evaluate(() => ({ ...__bj.Sound.count }));
  const steps = {};
  await p.waitForTimeout(800);
  const loaded = await p.evaluate(() => Object.fromEntries(Object.entries(__bj.Sound.buffers).map(([k, v]) => [k, v.length])));
  await p.click('.chip.c25'); await p.waitForTimeout(1000); steps.afterChipTap = await counts();
  await p.click('#actions button:has-text("Deal")'); await p.waitForTimeout(4500); steps.afterDeal = await counts();
  for (let i = 0; i < 300; i++) { const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
    if (labels.some(isChip)) break; if (!labels.length) { await p.waitForTimeout(50); continue; }
    const pick = labels.includes('Stand') ? 'Stand' : (['No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0]); await p.click(`#actions button:not([disabled]):text-is("${pick}")`); if (await p.isVisible('#warnGo')) await p.click('#warnGo'); }
  await p.waitForTimeout(2500); steps.afterHand = await counts();
  await p.click('.chip.c25'); await p.waitForTimeout(1200); steps.afterNextChipTap_collect = await counts();
  const audio = await p.evaluate(() => { const c = window.AudioContext && new AudioContext(); return { state: c && c.state }; });
  // switch Sounds off: nothing is made (counts still tick, the switch stops the audio)
  // record each sound to a WAV
  const wavs = await p.evaluate(async () => {
    const enc = buf => { const d = buf.getChannelData(0), n = d.length, sr = buf.sampleRate, ab = new ArrayBuffer(44 + n * 2), v = new DataView(ab);
      const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
      let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(d[i]));
      for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 32767, true);
      let s = ''; const u = new Uint8Array(ab); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
      return { b64: btoa(s), peak: +peak.toFixed(3) }; };
    const out = {};
    const plan = { chips: [['chip', 0], ['chip', 0.12], ['chip', 0.24], ['chip', 0.36]], deal: [['deal', 0.05], ['deal', 0.5], ['deal', 0.95], ['deal', 1.4]], flip: [['flip', 0.05], ['flip', 0.75]], shuffle: [['shuffle', 0.05]], collect: [['collect', 0.05], ['collect', 1.05]] };
    for (const [name, list] of Object.entries(plan)) {
      const len = name === 'shuffle' ? 2.6 : name === 'deal' ? 2.0 : name === 'collect' ? 2.1 : name === 'flip' ? 1.5 : 0.8;
      const c = new OfflineAudioContext(1, Math.round(44100 * len), 44100), g = c.createGain(); g.gain.value = 0.8; g.connect(c.destination);
      list.forEach(([k, t]) => __bj.Sound.sound(c, g, k, t));
      out[name] = enc(await c.startRendering());
    }
    return out; });
  const peaks = {};
  for (const [k, v] of Object.entries(wavs)) { fs.writeFileSync(`${dir}/sounds/${k}.wav`, Buffer.from(v.b64, 'base64')); peaks[k] = v.peak; }
  console.log(JSON.stringify({ loaded, steps, audio, peaksOfRecordings: peaks, errors: errs }, null, 1)); await b.close(); })();
