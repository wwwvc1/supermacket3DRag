/**
 * 原生 Web Speech 语音合成器 (GuideVoiceSynthesizer)
 * 基于浏览器 window.speechSynthesis 原生中文普通话朗读，零额外 CDN 依赖
 */
export class GuideVoiceSynthesizer {
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null
  private isMuted = false

  speak(text: string, onEnd?: () => void) {
    if (!this.synth || this.isMuted) {
      onEnd?.()
      return
    }

    this.synth.cancel() // 停止上一段正在播放的语音

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 1.05 // 稍快轻快的语速
    utterance.pitch = 1.0

    // 优先选择自然亲和的中文普通话音色
    const voices = this.synth.getVoices()
    const zhVoice = voices.find(
      (v) =>
        v.lang.includes('zh') ||
        v.lang.includes('cmn') ||
        v.name.includes('Chinese') ||
        v.name.includes('普通话')
    )
    if (zhVoice) {
      utterance.voice = zhVoice
    }

    if (onEnd) {
      utterance.onend = () => onEnd()
      utterance.onerror = () => onEnd()
    }

    this.synth.speak(utterance)
  }

  stop() {
    this.synth?.cancel()
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted
    if (this.isMuted) {
      this.stop()
    }
    return this.isMuted
  }

  getMuted(): boolean {
    return this.isMuted
  }
}

export const voiceSynthesizer = new GuideVoiceSynthesizer()
