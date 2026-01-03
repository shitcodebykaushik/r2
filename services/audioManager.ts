/**
 * Audio Manager - Procedural sound generation for rocket simulation
 * Uses Web Audio API for realistic engine sounds and mission control callouts
 */

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineOscillator: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private enabled: boolean = false;
  private volume: number = 0.3;
  
  // Track which events have been announced
  private announcedEvents: Set<string> = new Set();
  
  constructor() {
    // AudioContext must be created after user interaction
  }
  
  /**
   * Initialize audio context (call after user interaction)
   */
  initialize() {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);
      this.enabled = true;
      console.log('AudioManager initialized');
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }
  
  /**
   * Set master volume (0.0 to 1.0)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }
  
  /**
   * Start engine rumble sound
   */
  startEngineSound(stage: 1 | 2 = 1) {
    if (!this.audioContext || !this.masterGain) return;
    
    // Stop existing engine sound
    this.stopEngineSound();
    
    // Create engine rumble using multiple oscillators for richness
    const now = this.audioContext.currentTime;
    
    // Main engine tone
    this.engineOscillator = this.audioContext.createOscillator();
    this.engineGain = this.audioContext.createGain();
    
    const baseFreq = stage === 1 ? 60 : 80; // Stage 1 deeper rumble
    this.engineOscillator.type = 'sawtooth';
    this.engineOscillator.frequency.value = baseFreq;
    
    // Add slight frequency modulation for realism
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.frequency.value = 2; // 2 Hz wobble
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(this.engineOscillator.frequency);
    lfo.start(now);
    
    // Filter for muffled distant sound
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 1;
    
    // Connect chain
    this.engineOscillator.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
    
    // Fade in
    this.engineGain.gain.setValueAtTime(0, now);
    this.engineGain.gain.linearRampToValueAtTime(0.4, now + 0.5);
    
    this.engineOscillator.start(now);
  }
  
  /**
   * Stop engine sound
   */
  stopEngineSound() {
    if (this.engineOscillator && this.audioContext) {
      const now = this.audioContext.currentTime;
      if (this.engineGain) {
        this.engineGain.gain.linearRampToValueAtTime(0, now + 0.5);
      }
      this.engineOscillator.stop(now + 0.5);
      this.engineOscillator = null;
      this.engineGain = null;
    }
  }
  
  /**
   * Play sonic boom (sharp transient)
   */
  playSonicBoom() {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    // White noise burst
    const bufferSize = this.audioContext.sampleRate * 0.2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 200;
    filter.Q.value = 2;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(now);
    noise.stop(now + 0.3);
  }
  
  /**
   * Play staging separation sound (mechanical clunk)
   */
  playStagingSeparation() {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    // Low frequency thump
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.15);
    
    // Metallic clang (higher frequency burst)
    setTimeout(() => {
      if (!this.audioContext || !this.masterGain) return;
      const now2 = this.audioContext.currentTime;
      
      const osc2 = this.audioContext.createOscillator();
      osc2.type = 'square';
      osc2.frequency.value = 800;
      
      const gain2 = this.audioContext.createGain();
      gain2.gain.setValueAtTime(0.3, now2);
      gain2.gain.exponentialRampToValueAtTime(0.01, now2 + 0.08);
      
      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      
      osc2.start(now2);
      osc2.stop(now2 + 0.08);
    }, 50);
  }
  
  /**
   * Play warning alarm
   */
  playWarningAlarm() {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    // Alternating tone
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(600, now + 0.2);
    osc.frequency.setValueAtTime(800, now + 0.4);
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.setValueAtTime(0.3, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.8);
  }
  
  /**
   * Play RCS thruster pop
   */
  playRCSPop() {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 150;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.05);
  }
  
  /**
   * Play landing legs deployment sound
   */
  playLegsDeployment() {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = this.audioContext.currentTime;
    
    // Hydraulic whir
    const osc = this.audioContext.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.5);
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }
  
  /**
   * Speak mission control callout using Web Speech API
   */
  speak(text: string, eventKey?: string) {
    // Prevent duplicate announcements
    if (eventKey && this.announcedEvents.has(eventKey)) return;
    if (eventKey) this.announcedEvents.add(eventKey);
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 0.9;
      utterance.volume = this.volume * 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }
  
  /**
   * Reset announced events (for new launch)
   */
  resetAnnouncements() {
    this.announcedEvents.clear();
  }
  
  /**
   * Play all sounds for a phase
   */
  handlePhaseChange(phase: string, altitude: number, velocity: number, activeStage: number) {
    switch (phase) {
      case 'BURNING':
        if (!this.engineOscillator) {
          this.startEngineSound(activeStage as 1 | 2);
        }
        break;
        
      case 'STAGING':
        this.playStagingSeparation();
        this.speak('Stage separation confirmed', 'staging');
        break;
        
      case 'COASTING':
        this.stopEngineSound();
        break;
        
      case 'BOOSTBACK':
        this.speak('Boostback burn initiated', 'boostback');
        this.startEngineSound(1);
        break;
        
      case 'RE-ENTRY':
        this.speak('Re-entry burn', 'reentry');
        this.startEngineSound(1);
        break;
        
      case 'LANDING':
        this.speak('Landing burn', 'landing');
        this.startEngineSound(1);
        break;
        
      case 'LANDED':
        this.stopEngineSound();
        if (velocity < 5) {
          this.speak('Landing successful', 'landed-success');
        } else {
          this.speak('Hard landing detected', 'landed-hard');
        }
        break;
        
      case 'CRASHED':
        this.stopEngineSound();
        this.speak('Flight terminated', 'crashed');
        break;
    }
    
    // Altitude-based callouts
    if (altitude > 10000 && !this.announcedEvents.has('10km')) {
      this.speak('10 kilometers', '10km');
    }
    if (altitude > 50000 && !this.announcedEvents.has('50km')) {
      this.speak('50 kilometers', '50km');
    }
    if (altitude > 100000 && !this.announcedEvents.has('karman')) {
      this.speak('Karman line. We are now in space', 'karman');
    }
    
    // Velocity-based callouts
    const mach = velocity / 343;
    if (mach > 1 && !this.announcedEvents.has('mach1')) {
      this.speak('Mach 1', 'mach1');
      this.playSonicBoom();
    }
    if (mach > 5 && !this.announcedEvents.has('mach5')) {
      this.speak('Mach 5', 'mach5');
    }
  }
  
  /**
   * Clean up audio resources
   */
  dispose() {
    this.stopEngineSound();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
export const audioManager = new AudioManager();
