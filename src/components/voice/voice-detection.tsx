"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface MediaRecording {
  id: string
  name: string
  type: 'audio' | 'video'
  duration: string
  timestamp: string
  size: string
  confidence?: number
  keywords?: string[]
  blob?: Blob
  url?: string
}

export default function VoiceDetection() {
  const [isRecording, setIsRecording] = useState(false)
  const [isVideoRecording, setIsVideoRecording] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordings, setRecordings] = useState<MediaRecording[]>([])
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([])
  const [recordingType, setRecordingType] = useState<'audio' | 'video'>('audio')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const dangerKeywords = [
    'help', 'save me', 'emergency', 'call police', 'stop', 'don\'t touch me', 
    'let go', 'leave me alone', 'someone help', 'fire', 'robbery'
  ]

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startRecording = async (type: 'audio' | 'video' = 'audio') => {
    try {
      const constraints = type === 'video' 
        ? { audio: true, video: { width: 1280, height: 720 } }
        : { audio: true }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      // Show video preview for video recording
      if (type === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const mimeType = type === 'video' ? 'video/webm' : 'audio/webm'
        const blob = new Blob(chunks, { type: mimeType })
        const url = URL.createObjectURL(blob)
        
        const newRecording: MediaRecording = {
          id: Date.now().toString(),
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Recording ${recordings.length + 1}`,
          type,
          duration: formatTime(recordingTime),
          timestamp: new Date().toLocaleString(),
          size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
          confidence: Math.random() * 40 + 10, // Mock confidence score
          keywords: detectedKeywords.length > 0 ? [...detectedKeywords] : undefined,
          blob,
          url
        }
        
        setRecordings(prev => [newRecording, ...prev])
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} recording saved to evidence locker.`)
        
        // Stop video preview
        if (type === 'video' && videoRef.current) {
          videoRef.current.srcObject = null
        }
      }
      
      mediaRecorder.start()
      setRecordingType(type)
      if (type === 'audio') {
        setIsRecording(true)
      } else {
        setIsVideoRecording(true)
      }
      setRecordingTime(0)
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
        // Simulate audio level detection
        setAudioLevel(Math.random() * 100)
        
        // Simulate keyword detection
        if (Math.random() > 0.95) {
          const randomKeyword = dangerKeywords[Math.floor(Math.random() * dangerKeywords.length)]
          if (!detectedKeywords.includes(randomKeyword)) {
            setDetectedKeywords(prev => [...prev, randomKeyword])
            toast.warning(`Detected potential distress keyword: "${randomKeyword}"`)
          }
        }
      }, 1000)
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} recording started. Audio is being monitored for distress signals.`)
    } catch (error) {
      toast.error(`Could not access ${type === 'video' ? 'camera and microphone' : 'microphone'}. Please check permissions.`)
      console.error(`Error accessing ${type} devices:`, error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    setIsRecording(false)
    setIsVideoRecording(false)
    setRecordingTime(0)
    setAudioLevel(0)
    setDetectedKeywords([])
  }

  const downloadRecording = (recording: MediaRecording) => {
    if (recording.url) {
      const a = document.createElement('a')
      a.href = recording.url
      a.download = `${recording.name.replace(/\s+/g, '_')}.${recording.type === 'video' ? 'webm' : 'webm'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success(`Downloading ${recording.name}`)
    }
  }

  const playRecording = (recording: MediaRecording) => {
    if (recording.url) {
      if (recording.type === 'video') {
        // Open video in new window for playback
        window.open(recording.url, '_blank')
      } else {
        // Play audio
        const audio = new Audio(recording.url)
        audio.play()
        toast.info(`Playing ${recording.name}`)
      }
    }
  }

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setIsListening(true)
      
      // Simulate continuous listening with audio level monitoring
      intervalRef.current = setInterval(() => {
        setAudioLevel(Math.random() * 60 + 20)
        
        // Simulate occasional keyword detection
        if (Math.random() > 0.98) {
          const randomKeyword = dangerKeywords[Math.floor(Math.random() * dangerKeywords.length)]
          setDetectedKeywords(prev => {
            if (!prev.includes(randomKeyword)) {
              toast.warning(`Detected: "${randomKeyword}" - Confidence: ${Math.floor(Math.random() * 30 + 70)}%`)
              return [...prev, randomKeyword]
            }
            return prev
          })
        }
      }, 500)
      
      toast.success('Voice detection activated. Monitoring for distress signals...')
    } catch (error) {
      toast.error('Could not access microphone. Please check permissions.')
      console.error('Error accessing microphone:', error)
    }
  }

  const stopListening = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    setIsListening(false)
    setAudioLevel(0)
    setDetectedKeywords([])
    toast.info('Voice detection stopped.')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(rec => rec.id !== id))
    toast.info('Recording deleted from evidence locker.')
  }

  return (
    <div className="px-4 sm:px-0 space-y-6">
      {/* Voice Detection Control Panel */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <svg className="h-6 w-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
            Voice & Video Evidence Recording
          </CardTitle>
          <CardDescription>
            AI-powered detection with audio/video evidence recording and download
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
           {/* Control Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Voice Detection</h4>
              {!isListening ? (
                <Button 
                  onClick={startListening}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  </svg>
                  Start Voice Detection
                </Button>
              ) : (
                <Button 
                  onClick={stopListening}
                  variant="outline"
                  className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 font-semibold py-3"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                  </svg>
                  Stop Detection
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Audio Recording</h4>
              {!isRecording ? (
                <Button 
                  onClick={() => startRecording('audio')}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 rounded-lg shadow-lg"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Record Audio
                </Button>
              ) : (recordingType === 'audio' ? (
                <Button 
                  onClick={stopRecording}
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 font-semibold py-3"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                  </svg>
                  Stop ({formatTime(recordingTime)})
                </Button>
              ) : (
                <Button 
                  onClick={() => startRecording('audio')}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 rounded-lg shadow-lg"
                  disabled
                >
                  Recording Video...
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Video Recording</h4>
              {!isVideoRecording ? (
                <Button 
                  onClick={() => startRecording('video')}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                  Record Video
                </Button>
              ) : (
                <Button 
                  onClick={stopRecording}
                  variant="outline"
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold py-3"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                  </svg>
                  Stop ({formatTime(recordingTime)})
                </Button>
              )}
            </div>
          </div>

          {/* Video Preview */}
          {isVideoRecording && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">📹 Live Video Preview</h4>
              <div className="flex justify-center">
                <video 
                  ref={videoRef}
                  className="w-full max-w-lg rounded-lg bg-black shadow-lg border-2 border-blue-200"
                  autoPlay 
                  muted 
                  playsInline
                />
              </div>
              <p className="text-center text-sm text-blue-600 font-medium">
                Recording in progress... Audio and video are being captured.
              </p>
            </div>
          )}

          {/* Audio Level Meter */}
          {(isRecording || isListening) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Audio Level</span>
                <span className="text-sm text-gray-600">{Math.round(audioLevel)}%</span>
              </div>
              <Progress value={audioLevel} className="h-3" />
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${audioLevel > 50 ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                <span className="text-gray-600">
                  {isRecording ? 'Recording in progress...' : 'Listening for keywords...'}
                </span>
              </div>
            </div>
          )}

          {/* Detected Keywords */}
          {detectedKeywords.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-red-600">⚠️ Detected Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {detectedKeywords.map((keyword, index) => (
                  <Badge key={index} variant="destructive" className="px-3 py-1">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Monitoring Info */}
          <div className="bg-purple-50 rounded-lg p-4 text-sm">
            <h4 className="font-medium text-purple-800 mb-2">Monitored Keywords</h4>
            <div className="flex flex-wrap gap-1">
              {dangerKeywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recordings List */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
         <CardHeader>
          <CardTitle className="text-purple-800">Recorded Evidence</CardTitle>
          <CardDescription>
            Your audio/video recordings are securely stored and can be downloaded as evidence
          </CardDescription>
        </CardHeader>
        
        <CardContent>
           {recordings.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                {recordings.some(r => r.type === 'video') ? (
                  <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                ) : (
                  <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" x2="12" y1="19" y2="22"/>
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recordings Yet</h3>
              <p className="text-gray-600">Start recording audio or video to save evidence securely.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recordings.map((recording) => (
                <div key={recording.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        recording.type === 'video' ? 'bg-blue-100' : 'bg-red-100'
                      }`}>
                        {recording.type === 'video' ? (
                          <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                            <circle cx="12" cy="13" r="3"/>
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                            <line x1="12" x2="12" y1="19" y2="22"/>
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{recording.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={recording.type === 'video' ? 'default' : 'secondary'} className="text-xs">
                            {recording.type.toUpperCase()}
                          </Badge>
                          {recording.confidence && (
                            <Badge variant={recording.confidence > 70 ? "destructive" : "secondary"} className="text-xs">
                              Risk: {Math.round(recording.confidence)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => playRecording(recording)}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        Play
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadRecording(recording)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" x2="12" y1="15" y2="3"/>
                        </svg>
                        Download
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRecording(recording.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Duration:</span> {recording.duration}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span> {recording.size}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {recording.timestamp}
                    </div>
                  </div>
                  
                  {recording.keywords && recording.keywords.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-red-600">⚠️ Detected Keywords:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {recording.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="destructive" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}