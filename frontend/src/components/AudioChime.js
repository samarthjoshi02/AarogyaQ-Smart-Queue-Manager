// Web Audio API synthesiser for a professional medical "ding-dong" chime
let audioCtx = null;

export const playChime = () => {
  try {
    // Initialize audio context on demand (due to browser autoplay policies)
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Resume context if suspended
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Helper to play a single chime note with an envelope
    const playNote = (frequency, startTime, duration) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      // Setup sine wave for a clean whistle-like bell sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, startTime);

      // Add a slight frequency decay to sound like a physical bell hitting
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.98, startTime + duration);

      // ADSR Envelope: Instant attack, long exponential decay to silence
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05); // Attack
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Decay/Sustain/Release

      // Connect nodes
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      // Start & Stop
      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
    };

    // "Ding Dong" Chime Sequence:
    // 1st Note: E5 (659.25 Hz) starting at t = 0
    playNote(659.25, now, 1.2);

    // 2nd Note: C5 (523.25 Hz) starting at t = 0.4 seconds
    playNote(523.25, now + 0.4, 1.5);

    console.log('[Audio] Successfully synthesized chime chime.');
  } catch (error) {
    console.error('[Audio] Web Audio API chime error:', error);
  }
};
