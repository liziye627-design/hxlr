export type STTListener = (state: { recording: boolean; transcript?: string; playerId?: string; isFinal?: boolean; error?: string }) => void

class STTService {
  private static instance: STTService
  private RecognitionCtor: any
  private recognition: any | null = null
  private listeners: STTListener[] = []

  private constructor() {
    const w: any = typeof window !== 'undefined' ? window : {}
    this.RecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition || null
  }

  static getInstance(): STTService {
    if (!STTService.instance) STTService.instance = new STTService()
    return STTService.instance
  }

  supported(): boolean { return !!this.RecognitionCtor }

  subscribe(listener: STTListener) {
    this.listeners.push(listener)
    return () => { this.listeners = this.listeners.filter(l => l !== listener) }
  }

  private notify(payload: { recording: boolean; transcript?: string; playerId?: string; isFinal?: boolean; error?: string }) {
    for (const l of this.listeners) l(payload)
  }

  start(playerId: string) {
    if (!this.supported()) { this.notify({ recording: false, error: 'stt_unsupported' }); return }
    if (this.recognition) this.stop()
    this.recognition = new this.RecognitionCtor()
    this.recognition.lang = 'zh-CN'
    this.recognition.continuous = false
    this.recognition.interimResults = true
    let finalText = ''
    this.recognition.onstart = () => this.notify({ recording: true, playerId })
    this.recognition.onerror = (e: any) => this.notify({ recording: false, playerId, error: String(e?.error || 'stt_error') })
    this.recognition.onresult = (event: any) => {
      const results = event.results
      const last = results[results.length - 1]
      const text = last[0]?.transcript || ''
      const isFinal = last.isFinal === true
      if (isFinal) finalText = text
      this.notify({ recording: true, transcript: text, playerId, isFinal })
    }
    this.recognition.onend = () => {
      const t = finalText.trim()
      this.notify({ recording: false, transcript: t, playerId, isFinal: true })
      this.recognition = null
    }
    try { this.recognition.start() } catch { this.notify({ recording: false, playerId, error: 'stt_start_failed' }) }
  }

  stop() {
    try { this.recognition?.stop?.() } catch {}
    this.recognition = null
    this.notify({ recording: false })
  }
}

export const stt = STTService.getInstance()
