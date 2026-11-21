// All sound is synthesised with WebAudio — no audio files, no network.
// Footsteps are short filtered noise taps (a guard's are lower and louder),
// the alarm is a two-tone sting, pickups chime, and the win is a small arpeggio.
// Volume and stereo pan follow how far a guard is from the player, so the
// footsteps tell you where a guard is before you see them.
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
  }

  /** Create the context on the first user gesture (browsers require one). */
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  /** A short burst of filtered noise: a footstep. `pan` -1..1, `low` for guards. */
  footstep(pan, volume, low) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const length = Math.floor(this.ctx.sampleRate * 0.07);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = low ? 320 : 700;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    source.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.master);
    source.start(t);
  }

  /** A plain oscillator note with a quick envelope. */
  tone(freq, dur, type, volume, when = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  alarm() {
    this.tone(392, 0.16, 'square', 0.12);
    this.tone(311, 0.22, 'square', 0.12, 0.16);
  }

  suspicious() {
    this.tone(523, 0.12, 'triangle', 0.1);
  }

  pickup() {
    this.tone(659, 0.12, 'sine', 0.14);
    this.tone(988, 0.18, 'sine', 0.12, 0.09);
  }

  pebble() {
    this.tone(180, 0.05, 'triangle', 0.1);
    this.tone(140, 0.06, 'triangle', 0.08, 0.12);
  }

  doorOpen() {
    this.tone(220, 0.2, 'sine', 0.12);
    this.tone(330, 0.3, 'sine', 0.12, 0.12);
  }

  caught() {
    this.tone(233, 0.25, 'sawtooth', 0.12);
    this.tone(175, 0.4, 'sawtooth', 0.12, 0.2);
  }

  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => this.tone(freq, 0.28, 'sine', 0.13, i * 0.13));
  }
}
