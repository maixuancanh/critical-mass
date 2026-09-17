// src/audio/GeigerAudio.ts
// Pure Procedural Web Audio API sound synthesizer
// Zero external MP3/WAV files, zero load latency, 100% offline capable

class GeigerAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private backgroundInterval: number | null = null;
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBackground();
      this.stopHum();
    } else {
      this.startBackground();
      this.startHum();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Authentic Geiger-Müller radiation click
  public playGeigerClick(intensity: number = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.003); // 3ms click
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const decay = Math.exp(-i / (bufferSize * 0.28));
        data[i] = (Math.random() * 2 - 1) * decay;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2800 + (Math.random() * 400 - 200);
      filter.Q.value = 4.5;

      const gain = this.ctx.createGain();
      gain.gain.value = Math.min(0.85, 0.3 * intensity);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {
      // Audio context might be restricted
    }
  }

  // Pneumatic release / air pressure valve hiss
  public playPneumaticHiss() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1800;

      const gain = this.ctx.createGain();
      gain.gain.value = 0.25;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {
      // Ignore
    }
  }

  // Heavy mechanical switch clunk
  public playSwitchClunk() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.05);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // High-voltage capacitor charge & discharge
  public playDischarge() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.playPneumaticHiss();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.18);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.4);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  // Chamber breach explosive boom + metallic ring
  public playChamberBreach(chamberIndex: number, totalBreached: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Sub-bass thump
    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    const pitch = 95 + totalBreached * 18;

    bass.type = 'sine';
    bass.frequency.setValueAtTime(pitch, t);
    bass.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    bassGain.gain.setValueAtTime(0.6, t);
    bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    bass.connect(bassGain);
    bassGain.connect(this.ctx.destination);

    bass.start(t);
    bass.stop(t + 0.4);

    // Resonant ring
    const metal = this.ctx.createOscillator();
    const metalGain = this.ctx.createGain();

    metal.type = 'triangle';
    metal.frequency.setValueAtTime(520 + chamberIndex * 70, t);
    metal.frequency.exponentialRampToValueAtTime(260, t + 0.22);

    metalGain.gain.setValueAtTime(0.25, t);
    metalGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    metal.connect(metalGain);
    metalGain.connect(this.ctx.destination);

    metal.start(t);
    metal.stop(t + 0.25);
  }

  // Radiation alarm siren for high-tier cascades
  public playCriticalAlarm() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.linearRampToValueAtTime(960, t + 0.16);
    osc.frequency.linearRampToValueAtTime(700, t + 0.32);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Meltdown Jackpot Fanfare
  public playMeltdownJackpot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + i * 0.085;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  // Ambient Cherenkov sub-bass hum
  public startHum() {
    if (this.isMuted || this.humOsc) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      this.humOsc = this.ctx.createOscillator();
      this.humGain = this.ctx.createGain();

      this.humOsc.type = 'sine';
      this.humOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // 55Hz European grid hum

      this.humGain.gain.setValueAtTime(0.03, this.ctx.currentTime);

      this.humOsc.connect(this.humGain);
      this.humGain.connect(this.ctx.destination);

      this.humOsc.start();
    } catch {
      // Ignore
    }
  }

  public stopHum() {
    if (this.humOsc) {
      try {
        this.humOsc.stop();
        this.humOsc.disconnect();
      } catch {
        // Ignore
      }
      this.humOsc = null;
      this.humGain = null;
    }
  }

  // Ambient background clicks
  public startBackground() {
    if (this.backgroundInterval) return;
    this.startHum();
    this.backgroundInterval = window.setInterval(() => {
      if (Math.random() < 0.38) {
        this.playGeigerClick(0.35);
      }
    }, 550);
  }

  public stopBackground() {
    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval);
      this.backgroundInterval = null;
    }
    this.stopHum();
  }
}

export const geigerAudio = new GeigerAudioEngine();
