/**
 * Procedurally generates sound effects using the Web Audio API.
 * No external sound files needed.
 */
export default class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.enabled = true;
    }

    // Initialize on first user interaction to comply with browser autoplay policies
    init() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
    }

    playTone(freq, type, duration, vol) {
        if (!this.audioCtx || !this.enabled) return;

        // Resume context if suspended
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        gainNode.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + duration);
    }

    playMove() {
        this.playTone(300, 'sine', 0.1, 0.1);
    }

    playMerge() {
        this.playTone(600, 'triangle', 0.15, 0.2);
    }

    playWin() {
        if (!this.audioCtx || !this.enabled) return;
        const now = this.audioCtx.currentTime;

        // Play a cheerful arpeggio
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'sine', 0.3, 0.2), i * 150);
        });
    }

    playGameOver() {
        if (!this.audioCtx || !this.enabled) return;

        // Play a descending sorrowful tone
        [300, 250, 200, 150].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'sawtooth', 0.4, 0.15), i * 200);
        });
    }
}
