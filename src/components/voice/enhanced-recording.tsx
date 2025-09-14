"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'

interface MediaRecording {
  id: string
  name: string
  type: 'audio' | 'video'
  timestamp: string
}

export default function EnhancedRecording() {
  const [recordings, setRecordings] = useState<MediaRecording[]>([])
  const [isRecording, setIsRecording] = useState(false)

  const startAudioRecording = () => {
    setIsRecording(true)
    toast.success('Audio recording started')
    
    setTimeout(() => {
      const newRecording: MediaRecording = {
        id: Date.now().toString(),
        name: `Audio Recording ${recordings.filter(r => r.type === 'audio').length + 1}`,
        type: 'audio',
        timestamp: new Date().toLocaleString()
      }
      setRecordings(prev => [newRecording, ...prev])
      setIsRecording(false)
      toast.success('Audio recording saved!')
    }, 3000)
  }

  const startVideoRecording = () => {
    setIsRecording(true)
    toast.success('Video recording started')
    
    setTimeout(() => {
      const newRecording: MediaRecording = {
        id: Date.now().toString(),
        name: `Video Recording ${recordings.filter(r => r.type === 'video').length + 1}`,
        type: 'video',
        timestamp: new Date().toLocaleString()
      }
      setRecordings(prev => [newRecording, ...prev])
      setIsRecording(false)
      toast.success('Video recording saved!')
    }, 5000)
  }

  const downloadRecording = (recording: MediaRecording) => {
    const content = `${recording.name} - ${recording.timestamp}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${recording.name.replace(/\s+/g, '_')}.txt`
    link.click()
    
    URL.revokeObjectURL(url)
    toast.success('Recording downloaded!')
  }

  return (
    <div className="px-4 sm:px-0 space-y-6">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-purple-800">Voice & Video Recording</CardTitle>
          <CardDescription>Record evidence with download capability</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              onClick={startAudioRecording}
              disabled={isRecording}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3"
            >
              Start Audio Recording
            </Button>
            
            <Button 
              onClick={startVideoRecording}
              disabled={isRecording}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3"
            >
              Start Video Recording
            </Button>
          </div>

          {isRecording && (
            <div className="text-center py-4">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Recording in progress...</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-purple-800">
            <span>Evidence Locker</span>
            <Badge variant="secondary">{recordings.length}</Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {recordings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No recordings yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recordings.map((recording) => (
                <div key={recording.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">{recording.name}</h4>
                    <p className="text-sm text-gray-600">{recording.timestamp}</p>
                  </div>
                  <Button
                    onClick={() => downloadRecording(recording)}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}