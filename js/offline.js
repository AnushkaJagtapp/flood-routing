// FloodRoute Low-Bandwidth, SMS Gateway & Emergency Sound Engine
// Formats critical road accessibility data for zero-bandwidth / 2G SMS transmission
// and provides audible safety guidance during power disruptions.

class EmergencyOfflineModule {
  constructor(districtData) {
    this.data = districtData;
    this.audioCtx = null;
    this.isMuted = false;
  }

  // Generate 160-character compliant SMS for low-connectivity broadcast
  generateEmergencySMS(targetShelterName = "St. Jude Shelter") {
    const safeRoads = this.data.roadSegments.filter(r => r.status === 'SAFE').map(r => r.name.split(' ')[0]);
    const blockedRoads = this.data.roadSegments.filter(r => r.status === 'BLOCKED').map(r => r.name.split(' ')[0]);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Condensed SMS format under 160 chars
    const sms = `[FLOODROUTE ${timeStr}] SAFE: ${safeRoads.slice(0, 3).join(', ')} | BLOCKED: ${blockedRoads.slice(0, 2).join(', ')} | SHELTER: ${targetShelterName} OPEN | HELPLINE: 112, 1077`;
    
    return sms;
  }

  // Generate Turn-by-Turn Text Route for Plain SMS / WhatsApp / USSD
  generateTurnByTurnText(routeResult) {
    if (!routeResult || !routeResult.success) {
      return "NO SAFE ROUTE FOUND. All connecting roads submerged. Move to upper floors and call 112.";
    }

    const lines = [];
    lines.push(`*** FLOODROUTE SAFE NAVIGATION GUIDANCE ***`);
    lines.push(`Mode: ${routeResult.vehicle.label}`);
    lines.push(`Total Distance: ${routeResult.totalDistanceKm} km | Est. Time: ~${routeResult.estimatedTimeMinutes} mins`);
    lines.push(`Route Safety Rating: ${routeResult.routeSafety}`);
    lines.push(`Max Water Depth: ${routeResult.maxWaterDepthCm} cm`);
    lines.push(`----------------------------------------`);
    
    routeResult.turnByTurn.forEach(step => {
      lines.push(`${step.stepNumber}. ${step.instruction}`);
      lines.push(`   Distance: ${step.distance} | Elevation: ${step.elevation}`);
      lines.push(`   Status: [${step.status}] - ${step.waterDepth}`);
      if (step.note) lines.push(`   Note: ${step.note}`);
      lines.push(``);
    });

    lines.push(`EMERGENCY CONTACTS: DDMA Flood Control: 1077 | Ambulance: 108 | Police: 112`);
    return lines.join('\n');
  }

  // Web Audio Synthesizer (No external sound files required)
  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playSafeChime() {
    if (this.isMuted) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      
      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.3); // G5

      osc2.frequency.setValueAtTime(261.63, now); // C4
      osc2.frequency.exponentialRampToValueAtTime(329.63, now + 0.15);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch (e) {
      console.warn("Audio unavailable", e);
    }
  }

  playHazardWarning() {
    if (this.isMuted) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      // Low emergency warning buzz
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(196, now + 0.15);
      osc.frequency.setValueAtTime(220, now + 0.3);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn("Audio unavailable", e);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}
