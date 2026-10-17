/**
 * Audio — lightweight, asset-free sound via the Web Audio API.
 *
 * No external files, no network. Every effect is a short synthesised tone, so the
 * app ships with zero binary audio assets (a deliberate constraint — see the
 * project README, R1/R3). The `AudioContext` is created **only** on
 * {@link SoundEngine.init}, which the UI calls from the first user gesture, so
 * the browser autoplay policy is respected.
 *
 * This module is browser-only and guards every DOM/`window` touch so it imports
 * cleanly in any context; where Audio is unavailable it degrades to silence.
 */
import type { SoundEngine, SoundName } from './types';

/** Tonal recipe for each effect. Frequencies in Hz, durations in seconds. */
const RECIPES: Record<SoundName, { freq: number; dur: number; type: OscillatorType; gain: number; slide?: number }> = {
  select: { freq: 660, dur: 0.06, type: 'sine', gain: 0.06 },
  match: { freq: 523, dur: 0.12, type: 'triangle', gain: 0.11 },
  error: { freq: 200, dur: 0.16, type: 'sawtooth', gain: 0.08, slide: 120 },
  hint: { freq: 880, dur: 0.18, type: 'sine', gain: 0.08 },
  shuffle: { freq: 392, dur: 0.24, type: 'square', gain: 0.06, slide: 740 },
  win: { freq: 523, dur: 0.5, type: 'triangle', gain: 0.1 },
  lose: { freq: 440, dur: 0.4, type: 'sawtooth', gain: 0.08, slide: 180 },
};

/** A tone step for sequenced effects (win/lose/hint). */
interface Step {
  freq: number;
  at: number; // seconds from now
  dur: number;
  type: OscillatorType;
  gain: number;
  /** Optional end frequency for a glide (error/lose sweeps). */
  slide?: number;
}

/** Resolve the AudioContext constructor across vendor prefixes. */
function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

class WebAudioSoundEngine implements SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor = getAudioContextCtor();
    if (!Ctor) return;
    this.ctx = new Ctor();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  play(name: SoundName, combo = 0): void {
    if (this.muted || !this.ctx) return;
    const recipe = RECIPES[name];

    // A few effects become a short sequence rather than a single tone.
    const sequence: Step[] =
      name === 'win'
        ? [
            { freq: 523, at: 0, dur: 0.14, type: 'triangle', gain: 0.1 },
            { freq: 659, at: 0.12, dur: 0.14, type: 'triangle', gain: 0.1 },
            { freq: 784, at: 0.24, dur: 0.14, type: 'triangle', gain: 0.1 },
            { freq: 1047, at: 0.36, dur: 0.22, type: 'triangle', gain: 0.1 },
          ]
        : name === 'hint'
          ? [
              { freq: 880, at: 0, dur: 0.09, type: 'sine', gain: 0.08 },
              { freq: 1175, at: 0.09, dur: 0.12, type: 'sine', gain: 0.08 },
            ]
          : name === 'lose'
            ? [
                { freq: 440, at: 0, dur: 0.2, type: 'sawtooth', gain: 0.08, slide: 220 },
                { freq: 220, at: 0.2, dur: 0.2, type: 'sawtooth', gain: 0.08 },
              ]
            : [
                {
                  freq: recipe.freq + Math.min(combo, COMBO_PITCH_STEPS) * COMBO_PITCH_STEP_HZ,
                  at: 0,
                  dur: recipe.dur,
                  type: recipe.type,
                  gain: recipe.gain,
                  slide: recipe.slide,
                },
              ];

    for (const step of sequence) {
      this.tone(step);
    }
  }

  private tone(step: Step): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const start = ctx.currentTime + step.at;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = step.type;
    osc.frequency.setValueAtTime(step.freq, start);
    if (step.slide !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(step.slide, start + step.dur);
    }

    // Quick attack, smooth exponential decay — a soft, non-casino click.
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(step.gain, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + step.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + step.dur + 0.02);
  }
}

/** Pitch raised ×N per Flow step for the match sound, so chains audibly climb. */
const COMBO_PITCH_STEP_HZ = 28;
const COMBO_PITCH_STEPS = 8;

/** Construct the live engine. Returns a no-op engine where Audio is unavailable. */
export function createSoundEngine(): SoundEngine {
  return new WebAudioSoundEngine();
}
