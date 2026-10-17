/**
 * Procedural Audio & Soundtrack Engine for "The Royal Study"
 * Includes:
 * 1. Tactile wooden piece, card, and hourglass sound effects (SFX)
 * 2. Full multi-track lo-fi boom-bap soundtrack ("The Royal Study Theme" - 82 BPM, Am-G-F-G)
 *    with Rhodes electric piano chords, warm sub-bass, boom-bap drums (kick, crisp snare, hi-hats),
 *    and vibraphone/kalimba lead melody, plus real-time volume & mute controls.
 */

// MIDI note to frequency helper
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Note constants
const NOTE = {
  E2: 40, F2: 41, G2: 43, A2: 45, B2: 47, C3: 48, D3: 50, E3: 52,
  F3: 53, G3: 55, A3: 57, B3: 59, C4: 60, D4: 62, E4: 64,
  F4: 65, G4: 67, A4: 69, B4: 71, C5: 72, D5: 74, E5: 76,
  G5: 79, A5: 81,
};

class SoundEffects {
  private ctx: AudioContext | null = null;
  public sfxEnabled = true;

  // Music state
  private musicMasterGain: GainNode | null = null;
  private isMusicPlaying = false;
  private musicEnabled = true;
  private musicVolume = 0.45; // 0.0 to 1.0
  private schedulerTimer: number | null = null;
  private current16thStep = 0;
  private nextNoteTime = 0;
  private noiseBuffer: AudioBuffer | null = null;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private ensureMusicGain(ctx: AudioContext): GainNode {
    if (!this.musicMasterGain) {
      this.musicMasterGain = ctx.createGain();
      this.musicMasterGain.gain.value = this.musicEnabled ? this.musicVolume : 0;
      this.musicMasterGain.connect(ctx.destination);
    }
    return this.musicMasterGain;
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.musicMasterGain) {
      const target = this.musicEnabled ? this.musicVolume : 0;
      this.musicMasterGain.gain.setTargetAtTime(
        target,
        this.ctx.currentTime,
        0.04
      );
    }
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    const ctx = this.getContext();
    if (!ctx) return;
    this.ensureMusicGain(ctx);

    if (enabled) {
      if (!this.isMusicPlaying) {
        this.startMusic();
      }
      this.musicMasterGain!.gain.setTargetAtTime(
        this.musicVolume,
        ctx.currentTime,
        0.05
      );
    } else {
      if (this.musicMasterGain) {
        this.musicMasterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      }
    }
  }

  public isMusicActive(): boolean {
    return this.musicEnabled;
  }

  public startMusicIfAllowed() {
    if (this.musicEnabled && !this.isMusicPlaying) {
      this.startMusic();
    }
  }

  public startMusic() {
    const ctx = this.getContext();
    if (!ctx) return;
    this.ensureMusicGain(ctx);

    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.current16thStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;

    const lookaheadMs = 50;
    const scheduleAheadSec = 0.18;
    const bpm = 82;
    const secondsPer16th = 60 / bpm / 4;

    const tick = () => {
      if (!this.isMusicPlaying || !this.ctx) return;
      while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadSec) {
        this.scheduleStep(this.ctx, this.current16thStep, this.nextNoteTime, secondsPer16th);
        this.nextNoteTime += secondsPer16th;
        this.current16thStep = (this.current16thStep + 1) % 192; // 12-bar full cycle (3x 4-bar sections)
      }
      this.schedulerTimer = window.setTimeout(tick, lookaheadMs);
    };

    tick();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.schedulerTimer !== null) {
      window.clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  /**
   * Schedules drums, bass, Rhodes chords, and vibraphone/kalimba melody for the 82 BPM groove
   * matching the uploaded track:
   * 4-bar chord loop (64 16th steps):
   * - Bar 0 (steps 0..15): Am (A2 bass, A3-C4-E4 chord)
   * - Bar 1 (steps 16..31): G  (G2 bass, G3-B3-D4 chord)
   * - Bar 2 (steps 32..47): Fmaj7 (F2 bass, F3-A3-C4-E4 chord)
   * - Bar 3 (steps 48..63): F -> G turnaround (steps 48..55 F, steps 56..63 G)
   */
  private scheduleStep(
    ctx: AudioContext,
    totalStep: number,
    time: number,
    stepDur: number
  ) {
    if (!this.musicEnabled || this.musicVolume <= 0.001) return;
    const dest = this.ensureMusicGain(ctx);

    const stepIn4Bars = totalStep % 64;
    const barIdx = Math.floor(stepIn4Bars / 16);
    const stepInBar = stepIn4Bars % 16;
    const section = Math.floor(totalStep / 64); // 0 = Main Vibe, 1 = High Bell Vibe, 2 = Chill Groove

    // 1. BOOM-BAP DRUMS
    // Kick on 0, 7, 10 (and turnaround pickup on 14)
    if (
      stepInBar === 0 ||
      stepInBar === 7 ||
      stepInBar === 10 ||
      (barIdx === 3 && stepInBar === 14)
    ) {
      this.triggerKick(ctx, dest, time);
    }

    // Crisp Rim/Snare on beat 2 (step 4) and beat 4 (step 12)
    if (stepInBar === 4 || stepInBar === 12) {
      this.triggerSnare(ctx, dest, time);
    }

    // Hi-Hat on every 8th note (even steps) + subtle ghost 16th on step 15
    if (stepInBar % 2 === 0 || stepInBar === 15) {
      const isOpen = stepInBar === 14 && barIdx % 2 === 1;
      this.triggerHiHat(
        ctx,
        dest,
        time,
        isOpen ? 0.18 : 0.045,
        stepInBar % 4 === 0 ? 0.14 : 0.08
      );
    }

    // 2. WARM ELECTRIC BASS & RHODES CHORDS
    if (barIdx === 0) {
      // Am
      if (stepInBar === 0) {
        this.triggerRhodesChord(ctx, dest, time, [NOTE.A3, NOTE.C4, NOTE.E4], stepDur * 14);
        this.triggerBass(ctx, dest, time, NOTE.A2, stepDur * 6);
      }
      if (stepInBar === 7) this.triggerBass(ctx, dest, time, NOTE.E2 || 40, stepDur * 2.5);
      if (stepInBar === 10) this.triggerBass(ctx, dest, time, NOTE.A2, stepDur * 5);
    } else if (barIdx === 1) {
      // G
      if (stepInBar === 0) {
        this.triggerRhodesChord(ctx, dest, time, [NOTE.G3, NOTE.B3, NOTE.D4], stepDur * 14);
        this.triggerBass(ctx, dest, time, NOTE.G2, stepDur * 6);
      }
      if (stepInBar === 7) this.triggerBass(ctx, dest, time, NOTE.D3, stepDur * 2.5);
      if (stepInBar === 10) this.triggerBass(ctx, dest, time, NOTE.G2, stepDur * 5);
    } else if (barIdx === 2) {
      // Fmaj7
      if (stepInBar === 0) {
        this.triggerRhodesChord(ctx, dest, time, [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.E4], stepDur * 14);
        this.triggerBass(ctx, dest, time, NOTE.F2, stepDur * 6);
      }
      if (stepInBar === 7) this.triggerBass(ctx, dest, time, NOTE.C3, stepDur * 2.5);
      if (stepInBar === 10) this.triggerBass(ctx, dest, time, NOTE.F2, stepDur * 5);
    } else if (barIdx === 3) {
      // Turnaround: F (0..7) -> G (8..15)
      if (stepInBar === 0) {
        this.triggerRhodesChord(ctx, dest, time, [NOTE.F3, NOTE.A3, NOTE.C4], stepDur * 7.5);
        this.triggerBass(ctx, dest, time, NOTE.F2, stepDur * 7);
      }
      if (stepInBar === 8) {
        this.triggerRhodesChord(ctx, dest, time, [NOTE.G3, NOTE.B3, NOTE.D4], stepDur * 7.5);
        this.triggerBass(ctx, dest, time, NOTE.G2, stepDur * 7);
      }
    }

    // 3. VIBRAPHONE / KALIMBA LEAD MELODY (matches the track's soulful minor-pentatonic phrases)
    if (section === 0) {
      const melodyMap: Record<number, [number, number]> = {
        // Bar 0 (Am): E5 - C5 - A4 - G4 - A4 - C5 - A4 - G4 - E4 - D4
        0: [NOTE.E5, 2],
        3: [NOTE.C5, 2],
        6: [NOTE.A4, 2],
        8: [NOTE.G4, 2],
        10: [NOTE.A4, 2],
        12: [NOTE.C5, 2],
        14: [NOTE.A4, 2],
        // Bar 1 (G)
        16: [NOTE.G4, 3],
        20: [NOTE.E4, 2],
        22: [NOTE.D4, 3],
        26: [NOTE.E4, 2],
        28: [NOTE.G4, 2],
        30: [NOTE.A4, 2],
        // Bar 2 (Fmaj7)
        32: [NOTE.C5, 3],
        35: [NOTE.A4, 2],
        38: [NOTE.G4, 3],
        42: [NOTE.E4, 2],
        44: [NOTE.D4, 2],
        46: [NOTE.C4, 2],
        // Bar 3 (F -> G turnaround)
        48: [NOTE.F4, 3],
        52: [NOTE.A4, 2],
        54: [NOTE.C5, 2],
        56: [NOTE.B4, 3],
        60: [NOTE.G4, 3],
      };
      const m = melodyMap[stepIn4Bars];
      if (m) {
        this.triggerVibeNote(ctx, dest, time, m[0], stepDur * m[1]);
      }
    } else if (section === 1) {
      // Section B (0:46+ high bell motif)
      const highBellMap: Record<number, [number, number]> = {
        0: [NOTE.E5, 3],
        4: [NOTE.E5, 2],
        6: [NOTE.D5, 2],
        8: [NOTE.C5, 3],
        12: [NOTE.A4, 3],
        16: [NOTE.D5, 3],
        20: [NOTE.B4, 3],
        24: [NOTE.G4, 4],
        32: [NOTE.C5, 3],
        36: [NOTE.A4, 2],
        38: [NOTE.C5, 2],
        40: [NOTE.E5, 4],
        48: [NOTE.F4, 3],
        52: [NOTE.A4, 3],
        56: [NOTE.G4, 4],
        60: [NOTE.B4, 3],
      };
      const m = highBellMap[stepIn4Bars];
      if (m) {
        this.triggerVibeNote(ctx, dest, time, m[0], stepDur * m[1]);
      }
    } else {
      // Section C (1:09+ sparse warm Rhodes arpeggio accents)
      const sparseMap: Record<number, [number, number]> = {
        0: [NOTE.E4, 4],
        12: [NOTE.A4, 3],
        16: [NOTE.D4, 4],
        28: [NOTE.G4, 3],
        32: [NOTE.C4, 4],
        44: [NOTE.A4, 3],
        48: [NOTE.F4, 4],
        56: [NOTE.G4, 4],
      };
      const m = sparseMap[stepIn4Bars];
      if (m) {
        this.triggerVibeNote(ctx, dest, time, m[0], stepDur * m[1]);
      }
    }
  }

  private triggerKick(ctx: AudioContext, dest: AudioNode, time: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(125, time);
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.11);

    gain.gain.setValueAtTime(0.42, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.25);
  }

  private triggerSnare(ctx: AudioContext, dest: AudioNode, time: number) {
    // Crisp wooden rim/snare body
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, time);
    osc.frequency.exponentialRampToValueAtTime(110, time + 0.07);
    oscGain.gain.setValueAtTime(0.2, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.1);

    // Filtered snare wire noise
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, time);
    filter.Q.setValueAtTime(1.2, time);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.18, time);
    nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(dest);
    noise.start(time);
    noise.stop(time + 0.15);
  }

  private triggerHiHat(
    ctx: AudioContext,
    dest: AudioNode,
    time: number,
    duration: number,
    peakGain: number
  ) {
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(peakGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
    noise.stop(time + duration + 0.01);
  }

  private triggerBass(
    ctx: AudioContext,
    dest: AudioNode,
    time: number,
    midi: number,
    duration: number
  ) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(midiToFreq(midi), time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.28, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private triggerRhodesChord(
    ctx: AudioContext,
    dest: AudioNode,
    time: number,
    midiNotes: number[],
    duration: number
  ) {
    midiNotes.forEach((midi) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(midiToFreq(midi), time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.065, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(time);
      osc.stop(time + duration + 0.02);
    });
  }

  private triggerVibeNote(
    ctx: AudioContext,
    dest: AudioNode,
    time: number,
    midi: number,
    duration: number
  ) {
    const freq = midiToFreq(midi);

    // Warm fundamental + woody harmonic overtone (kalimba/vibraphone timbre)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, time);

    gain1.gain.setValueAtTime(0.001, time);
    gain1.gain.linearRampToValueAtTime(0.14, time + 0.012);
    gain1.gain.exponentialRampToValueAtTime(0.001, time + duration * 1.25);

    gain2.gain.setValueAtTime(0.001, time);
    gain2.gain.linearRampToValueAtTime(0.035, time + 0.008);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(dest);
    gain2.connect(dest);

    osc1.start(time);
    osc1.stop(time + duration * 1.25 + 0.02);
    osc2.start(time);
    osc2.stop(time + 0.14);
  }

  // --- SOUND EFFECTS (SFX) ---

  public playWoodSelect() {
    this.startMusicIfAllowed();
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(310, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.06);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  public playWoodPlace() {
    this.startMusicIfAllowed();
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(195, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.09);

    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playCardTransform() {
    this.startMusicIfAllowed();
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.11);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.125);
  }

  public playHourglassFlip() {
    this.startMusicIfAllowed();
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [340, 460].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.1, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.13);
    });
  }

  public playSuccess() {
    this.startMusicIfAllowed();
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.15, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.36);
    });
  }

  public playError() {
    this.startMusicIfAllowed();
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(115, now + 0.18);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  }
}

export const soundFX = new SoundEffects();
