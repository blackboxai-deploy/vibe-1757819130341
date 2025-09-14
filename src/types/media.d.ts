// Media API type definitions for better browser compatibility

declare global {
  interface Window {
    MediaRecorder: typeof MediaRecorder
  }
}

export interface MediaRecorderOptions {
  mimeType?: string
  audioBitsPerSecond?: number
  videoBitsPerSecond?: number
  bitsPerSecond?: number
}

export interface MediaRecording {
  id: string
  name: string
  type: 'audio' | 'video'
  duration: string
  timestamp: string
  size: string
  confidence?: number
  keywords?: string[]
  blob: Blob
  url: string
}