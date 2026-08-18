class SessionAudio {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private volume = 0.85

  setVolume(volume: number): void {
    this.volume = Math.max(0.1, Math.min(1, volume))
    if (this.context && this.masterGain) {
      this.masterGain.gain.setValueAtTime(0.35 + this.volume * 1.85, this.context.currentTime)
    }
  }

  async unlock(): Promise<void> {
    try {
      this.context ??= new AudioContext()
      if (!this.masterGain) {
        this.masterGain = this.context.createGain()
        this.compressor = this.context.createDynamicsCompressor()
        this.compressor.threshold.setValueAtTime(-18, this.context.currentTime)
        this.compressor.knee.setValueAtTime(18, this.context.currentTime)
        this.compressor.ratio.setValueAtTime(8, this.context.currentTime)
        this.compressor.attack.setValueAtTime(0.003, this.context.currentTime)
        this.compressor.release.setValueAtTime(0.2, this.context.currentTime)
        this.masterGain.connect(this.compressor).connect(this.context.destination)
        this.setVolume(this.volume)
      }
      if (this.context.state === 'suspended') await this.context.resume()
      this.tone(1, 1, 0.001)
    } catch {
      // Safari peut refuser l'audio : le timer continue normalement.
    }
  }

  private tone(frequency: number, duration: number, volume = 0.35, delay = 0, waveform: OscillatorType = 'triangle'): void {
    if (!this.context || this.context.state !== 'running') return
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    const start = this.context.currentTime + delay
    oscillator.type = waveform
    oscillator.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0.001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
    oscillator.connect(gain).connect(this.masterGain ?? this.context.destination)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.02)
  }

  private alertTone(frequency: number, duration: number, volume: number, delay = 0, waveform: OscillatorType = 'square'): void {
    this.tone(frequency, duration, volume, delay, waveform)
    this.tone(frequency * 1.5, duration * 0.82, volume * 0.48, delay + 0.012, 'triangle')
  }

  private speak(text: string, rate = 1.25, language = 'fr-FR'): void {
    try {
      if (!('speechSynthesis' in window)) return
      const message = new SpeechSynthesisUtterance(text)
      message.lang = language
      message.volume = this.volume
      message.rate = rate
      window.speechSynthesis.speak(message)
    } catch {
      // Les tonalités restent disponibles si la voix ne l'est pas.
    }
  }

  startCount(number: number): void {
    this.alertTone(620 + number * 220, 0.24, 0.48, 0, 'sine')
    this.speak(String(number), 1.35)
  }

  countdown(number: number, announceStop = false): void {
    this.alertTone(980 + number * 190, 0.22, 0.46)
    this.speak(String(number), 1.4)
    if (number === 1 && announceStop) this.speak('Stop', 1.3, 'en-US')
  }

  halfway(): void {
    this.alertTone(1320, 0.25, 0.46)
    this.speak('Moitié', 1.15)
  }

  preview(): void { this.phase(true) }

  phase(isWork: boolean): void {
    if (isWork) {
      this.alertTone(1280, 0.2, 0.5)
      this.alertTone(1680, 0.3, 0.52, 0.24)
    } else this.alertTone(920, 0.34, 0.5)
  }
  finish(): void {
    this.alertTone(1100, 0.2, 0.48)
    this.alertTone(1450, 0.22, 0.5, 0.25)
    this.alertTone(1820, 0.42, 0.54, 0.52)
  }
}

export const sessionAudio = new SessionAudio()
