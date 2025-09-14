"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

interface HotspotData {
  id: string
  lat: number
  lng: number
  intensity: number
  incidents: number
  area: string
  incidentTypes: string[]
  lastIncident: string
  description?: string
}



export default function SafetyHeatmap() {
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotData | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Enhanced heatmap data with real NYC locations
  const heatmapData: HotspotData[] = [
    {
      id: "1",
      lat: 40.7128,
      lng: -74.0060,
      intensity: 0.9,
      incidents: 23,
      area: "Financial District",
      incidentTypes: ["Harassment", "Theft", "Assault", "Stalking"],
      lastIncident: "2024-01-15 18:30",
      description: "High-traffic business district with frequent reports during rush hours and late evenings"
    },
    {
      id: "2",
      lat: 40.7589,
      lng: -73.9851,
      intensity: 0.8,
      incidents: 18,
      area: "Times Square",
      incidentTypes: ["Harassment", "Pickpocketing", "Verbal Abuse"],
      lastIncident: "2024-01-14 20:15",
      description: "Major tourist destination with crowded conditions leading to opportunistic incidents"
    },
    {
      id: "3",
      lat: 40.7505,
      lng: -73.9934,
      intensity: 0.85,
      incidents: 16,
      area: "Hell's Kitchen",
      incidentTypes: ["Assault", "Robbery", "Stalking", "Harassment"],
      lastIncident: "2024-01-13 22:45",
      description: "Mixed residential-commercial area with nightlife-related safety concerns"
    },
    {
      id: "4",
      lat: 40.7282,
      lng: -73.9942,
      intensity: 0.4,
      incidents: 7,
      area: "Greenwich Village",
      incidentTypes: ["Harassment", "Verbal Abuse"],
      lastIncident: "2024-01-12 19:20",
      description: "Generally safe neighborhood with occasional street harassment reports"
    },
    {
      id: "5",
      lat: 40.7614,
      lng: -73.9776,
      intensity: 0.3,
      incidents: 4,
      area: "Upper East Side",
      incidentTypes: ["Harassment"],
      lastIncident: "2024-01-10 16:30",
      description: "Upscale residential area with minimal safety incidents"
    },
    {
      id: "6",
      lat: 40.7549,
      lng: -73.9840,
      intensity: 0.6,
      incidents: 11,
      area: "Midtown East",
      incidentTypes: ["Harassment", "Theft", "Verbal Abuse"],
      lastIncident: "2024-01-16 14:20",
      description: "Busy commercial district with moderate safety concerns during business hours"
    },
    {
      id: "7",
      lat: 40.7831,
      lng: -73.9712,
      intensity: 0.7,
      incidents: 14,
      area: "Upper West Side",
      incidentTypes: ["Stalking", "Harassment", "Assault"],
      lastIncident: "2024-01-15 21:10",
      description: "Residential area near parks with evening safety concerns"
    },
    {
      id: "8",
      lat: 40.7260,
      lng: -74.0020,
      intensity: 0.5,
      incidents: 9,
      area: "Tribeca",
      incidentTypes: ["Harassment", "Theft"],
      lastIncident: "2024-01-11 17:45",
      description: "Trendy neighborhood with occasional incidents near entertainment venues"
    }
  ]

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Location access denied:', error)
          // Default to NYC center
          setCurrentLocation({ lat: 40.7580, lng: -73.9855 })
        }
      )
    } else {
      setCurrentLocation({ lat: 40.7580, lng: -73.9855 })
    }
  }, [])

   const drawRealtimeMap = () => {
    const canvas = canvasRef.current
    if (!canvas || !currentLocation) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * devicePixelRatio
    canvas.height = rect.height * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'

    const width = rect.width
    const height = rect.height

    // Create realistic map background with streets
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#f8fafc')
    gradient.addColorStop(1, '#e2e8f0')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Draw street grid pattern
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 1
    
    // Vertical streets
    for (let x = 0; x <= width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    
    // Horizontal streets
    for (let y = 0; y <= height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw major streets/avenues (thicker lines)
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 2
    
    // Major vertical avenues
    for (let x = 0; x <= width; x += 120) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    
    // Major horizontal streets
    for (let y = 0; y <= height; y += 100) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Calculate bounds based on data points
    const lats = heatmapData.map(spot => spot.lat)
    const lngs = heatmapData.map(spot => spot.lng)
    const minLat = Math.min(...lats) - 0.01
    const maxLat = Math.max(...lats) + 0.01
    const minLng = Math.min(...lngs) - 0.01
    const maxLng = Math.max(...lngs) + 0.01

    // Draw safety zones with realistic positioning
    heatmapData.forEach((spot) => {
      const x = ((spot.lng - minLng) / (maxLng - minLng)) * width
      const y = ((maxLat - spot.lat) / (maxLat - minLat)) * height
      const radius = 20 + (spot.intensity * 25)

      // Create realistic heat gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      let color = '#10b981' // Safe - green
      if (spot.intensity >= 0.8) color = '#dc2626' // Critical - red
      else if (spot.intensity >= 0.6) color = '#ea580c' // High - orange  
      else if (spot.intensity >= 0.4) color = '#d97706' // Medium - amber

      gradient.addColorStop(0, color + '60')
      gradient.addColorStop(0.6, color + '30')
      gradient.addColorStop(1, color + '08')

      // Draw heat zone
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fill()

      // Draw location marker
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, 2 * Math.PI)
      ctx.fill()

      // Add white border for visibility
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, 2 * Math.PI)
      ctx.stroke()

      // Add area label for high-risk zones
      if (spot.intensity >= 0.7) {
        ctx.fillStyle = '#374151'
        ctx.font = '12px Inter, sans-serif'
        ctx.textAlign = 'center'
        const textY = y + radius + 15
        
        // Add text background
        const textWidth = ctx.measureText(spot.area).width
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(x - textWidth/2 - 4, textY - 12, textWidth + 8, 16)
        
        // Add text
        ctx.fillStyle = '#374151'
        ctx.fillText(spot.area, x, textY)
      }
    })

    // Draw user's current location if available
    if (currentLocation) {
      const userX = ((currentLocation.lng - minLng) / (maxLng - minLng)) * width
      const userY = ((maxLat - currentLocation.lat) / (maxLat - minLat)) * height
      
      // Pulsing circle for current location
      const time = Date.now() / 1000
      const pulseRadius = 8 + Math.sin(time * 3) * 3
      
      // Outer pulse
      ctx.fillStyle = '#3b82f6' + '40'
      ctx.beginPath()
      ctx.arc(userX, userY, pulseRadius, 0, 2 * Math.PI)
      ctx.fill()
      
      // Inner location dot
      ctx.fillStyle = '#3b82f6'
      ctx.beginPath()
      ctx.arc(userX, userY, 8, 0, 2 * Math.PI)
      ctx.fill()
      
      // White border
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(userX, userY, 8, 0, 2 * Math.PI)
      ctx.stroke()
    }

    // Add map legend
    drawMapLegend(ctx, width, height)
  }

  const drawMapLegend = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const legendX = 10
    const legendY = height - 120
    
    // Legend background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(legendX, legendY, 140, 110)
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    ctx.strokeRect(legendX, legendY, 140, 110)

    // Legend title
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 12px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Safety Levels', legendX + 8, legendY + 18)

    // Legend items
    const legendItems = [
      { color: '#dc2626', label: 'Critical (0.8+)', y: 35 },
      { color: '#ea580c', label: 'High (0.6-0.8)', y: 50 },
      { color: '#d97706', label: 'Medium (0.4-0.6)', y: 65 },
      { color: '#10b981', label: 'Safe (<0.4)', y: 80 },
      { color: '#3b82f6', label: 'Your Location', y: 95 }
    ]

    ctx.font = '11px Inter, sans-serif'
    legendItems.forEach(item => {
      // Draw color dot
      ctx.fillStyle = item.color
      ctx.beginPath()
      ctx.arc(legendX + 15, legendY + item.y, 5, 0, 2 * Math.PI)
      ctx.fill()
      
      // Draw label
      ctx.fillStyle = '#374151'
      ctx.fillText(item.label, legendX + 25, legendY + item.y + 4)
    })
  }

   const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !currentLocation) return

    const rect = canvas.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const clickY = event.clientY - rect.top

    // Calculate bounds
    const lats = heatmapData.map(spot => spot.lat)
    const lngs = heatmapData.map(spot => spot.lng)
    const minLat = Math.min(...lats) - 0.01
    const maxLat = Math.max(...lats) + 0.01
    const minLng = Math.min(...lngs) - 0.01
    const maxLng = Math.max(...lngs) + 0.01

    // Find closest hotspot
    let closestHotspot: HotspotData | null = null
    let minDistance = Infinity

    heatmapData.forEach((spot) => {
      const spotX = ((spot.lng - minLng) / (maxLng - minLng)) * rect.width
      const spotY = ((maxLat - spot.lat) / (maxLat - minLat)) * rect.height
      const distance = Math.sqrt((clickX - spotX) ** 2 + (clickY - spotY) ** 2)
      const radius = 20 + (spot.intensity * 25)

      if (distance <= radius && distance < minDistance) {
        closestHotspot = spot
        minDistance = distance
      }
    })

    if (closestHotspot) {
      setSelectedHotspot(closestHotspot)
      toast.info(`Selected safety area - click for details`)
    }
  }

  const reportIncident = () => {
    if (currentLocation) {
      toast.success('Thank you for reporting. Your incident has been recorded anonymously to help keep the community safe.')
      // In real app, this would send data to backend
    } else {
      toast.error('Location access required to report incidents.')
    }
  }

  const findSafeRoute = () => {
    if (currentLocation) {
      const safeAreas = heatmapData.filter(area => area.intensity < 0.4)
      if (safeAreas.length > 0) {
        toast.success(`Found ${safeAreas.length} safe areas nearby. Check the map for green zones.`)
      } else {
        toast.warning('No safe zones identified in immediate area. Stay alert and consider alternative routes.')
      }
    } else {
      toast.error('Location access required for route planning.')
    }
  }

   useEffect(() => {
    const handleResize = () => {
      setTimeout(drawRealtimeMap, 100)
    }

    const animationFrame = () => {
      drawRealtimeMap()
      requestAnimationFrame(animationFrame)
    }

    if (currentLocation) {
      window.addEventListener('resize', handleResize)
      drawRealtimeMap()
      
      // Start animation for pulsing current location
      const animationId = requestAnimationFrame(animationFrame)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        cancelAnimationFrame(animationId)
      }
    }
  }, [currentLocation])

  const getIntensityLabel = (intensity: number) => {
    if (intensity >= 0.8) return { label: 'Critical', color: 'bg-red-600 text-white' }
    if (intensity >= 0.6) return { label: 'High', color: 'bg-orange-500 text-white' }
    if (intensity >= 0.4) return { label: 'Medium', color: 'bg-yellow-500 text-white' }
    return { label: 'Low', color: 'bg-green-500 text-white' }
  }

  const getIncidentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Assault': 'bg-red-100 text-red-800',
      'Robbery': 'bg-red-100 text-red-800',
      'Harassment': 'bg-orange-100 text-orange-800',
      'Stalking': 'bg-purple-100 text-purple-800',
      'Theft': 'bg-yellow-100 text-yellow-800',
      'Pickpocketing': 'bg-yellow-100 text-yellow-800',
      'Verbal Abuse': 'bg-blue-100 text-blue-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="px-4 sm:px-0">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-purple-800">Safety Incident Heatmap</CardTitle>
          <CardDescription>
            Real-time visualization of safety incidents. Red hotspots indicate higher risk zones. Click a hotspot for details.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Heatmap Canvas */}
            <div className="md:col-span-2 space-y-4">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="w-full h-96 bg-gray-800 rounded-lg cursor-pointer shadow-inner"
                style={{ aspectRatio: '3/2' }}
              />
              
              {/* Legend */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-600"></div>
                  <span>Critical (0.8+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                  <span>High (0.6-0.8)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                  <span>Medium (0.4-0.6)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span>Low (&lt;0.4)</span>
                </div>
              </div>
            </div>

            {/* Details Panel */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-4">Area Statistics</h3>
              
              {!selectedHotspot ? (
                <div className="text-center text-gray-500 py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M9 11a3 3 0 1 1 6 0c0 1.657-1 3-3 3s-3-1.343-3-3z"/>
                    <path d="M18 21h-6"/>
                    <path d="M6 21h6"/>
                    <path d="M3 9l9 9 9-9"/>
                  </svg>
                  <p className="text-sm">Click on a hotspot to view area details.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{selectedHotspot.area}</h4>
                      <Badge className={getIntensityLabel(selectedHotspot.intensity).color}>
                        {getIntensityLabel(selectedHotspot.intensity).label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{selectedHotspot.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Total Incidents:</span>
                      <p className="text-2xl font-bold text-red-600">{selectedHotspot.incidents}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Risk Level:</span>
                      <p className="text-2xl font-bold text-gray-800">
                        {Math.round(selectedHotspot.intensity * 100)}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700 block mb-2">Incident Types:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedHotspot.incidentTypes.map((type, index) => (
                        <Badge key={index} className={`text-xs ${getIncidentTypeColor(type)}`}>
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700">Last Incident:</span>
                    <p className="text-sm text-gray-600">{selectedHotspot.lastIncident}</p>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700">Coordinates:</span>
                    <p className="text-xs font-mono text-gray-600">
                      {selectedHotspot.lat.toFixed(4)}, {selectedHotspot.lng.toFixed(4)}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedHotspot(null)}
                    className="w-full mt-4"
                  >
                    Close Details
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-bold text-lg mb-4">Overall Safety Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-2xl font-bold text-red-600">{heatmapData.reduce((sum, spot) => sum + spot.incidents, 0)}</p>
                <p className="text-sm text-gray-600">Total Incidents</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-2xl font-bold text-orange-600">{heatmapData.filter(spot => spot.intensity >= 0.8).length}</p>
                <p className="text-sm text-gray-600">Critical Zones</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-2xl font-bold text-yellow-600">{heatmapData.filter(spot => spot.intensity >= 0.6 && spot.intensity < 0.8).length}</p>
                <p className="text-sm text-gray-600">High Risk Areas</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-2xl font-bold text-green-600">{heatmapData.filter(spot => spot.intensity < 0.6).length}</p>
                <p className="text-sm text-gray-600">Safe Zones</p>
              </div>
            </div>
          </div>

          {/* Report Incident Button */}
          <div className="mt-6 pt-6 border-t text-center">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg">
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
              Report Safety Incident
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              Help keep the community safe by reporting incidents anonymously.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}