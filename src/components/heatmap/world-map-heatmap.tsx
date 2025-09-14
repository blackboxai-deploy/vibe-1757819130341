"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface HotspotData {
  id: string
  lat: number
  lng: number
  intensity: number
  incidents: number
  area: string
  city: string
  country: string
  incidentTypes: string[]
  lastIncident: string
  description?: string
}

interface MapLocation {
  name: string
  center: [number, number]
  zoom: number
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

export default function WorldMapHeatmap() {
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotData | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string>('world')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Available map locations
  const mapLocations: Record<string, MapLocation> = {
    world: {
      name: 'World',
      center: [0, 0],
      zoom: 1,
      bounds: { north: 85, south: -85, east: 180, west: -180 }
    },
    india: {
      name: 'India',
      center: [20.5937, 78.9629],
      zoom: 5,
      bounds: { north: 37, south: 6, east: 97, west: 68 }
    },
    usa: {
      name: 'United States',
      center: [39.8283, -98.5795],
      zoom: 4,
      bounds: { north: 49, south: 25, east: -66, west: -125 }
    },
    europe: {
      name: 'Europe',
      center: [54.5260, 15.2551],
      zoom: 4,
      bounds: { north: 71, south: 35, east: 40, west: -10 }
    }
  }

  // Global heatmap data with real-world locations
  const getHeatmapData = (location: string): HotspotData[] => {
    const globalData: Record<string, HotspotData[]> = {
      world: [
        {
          id: "1", lat: 28.6139, lng: 77.2090, intensity: 0.8, incidents: 25,
          area: "Connaught Place", city: "New Delhi", country: "India",
          incidentTypes: ["Harassment", "Stalking", "Verbal Abuse"],
          lastIncident: "2024-01-15 19:30",
          description: "High-traffic commercial area with frequent evening incidents"
        },
        {
          id: "2", lat: 19.0760, lng: 72.8777, intensity: 0.9, incidents: 32,
          area: "Colaba", city: "Mumbai", country: "India",
          incidentTypes: ["Harassment", "Assault", "Theft"],
          lastIncident: "2024-01-16 21:15",
          description: "Tourist area with high crime rates, especially at night"
        },
        {
          id: "3", lat: 40.7128, lng: -74.0060, intensity: 0.7, incidents: 18,
          area: "Times Square", city: "New York", country: "USA",
          incidentTypes: ["Harassment", "Pickpocketing"],
          lastIncident: "2024-01-14 20:00",
          description: "Busy tourist area with occasional incidents"
        }
      ],
      india: [
        {
          id: "1", lat: 28.6139, lng: 77.2090, intensity: 0.8, incidents: 25,
          area: "Connaught Place", city: "New Delhi", country: "India",
          incidentTypes: ["Harassment", "Stalking", "Verbal Abuse"],
          lastIncident: "2024-01-15 19:30",
          description: "High-traffic commercial area with frequent evening incidents"
        }
      ],
      usa: [
        {
          id: "3", lat: 40.7128, lng: -74.0060, intensity: 0.7, incidents: 18,
          area: "Times Square", city: "New York", country: "USA",
          incidentTypes: ["Harassment", "Pickpocketing"],
          lastIncident: "2024-01-14 20:00",
          description: "Busy tourist area with occasional incidents"
        }
      ],
      europe: []
    }
    return globalData[location] || globalData.world
  }

  // Convert lat/lng to canvas coordinates
  const latLngToCanvas = (lat: number, lng: number, bounds: MapLocation['bounds'], canvasWidth: number, canvasHeight: number) => {
    const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * canvasWidth
    const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * canvasHeight
    return [x, y]
  }

  const drawWorldMap = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    
    // Set canvas size
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

    // Clear canvas
    ctx.fillStyle = '#0f172a' // Dark blue ocean
    ctx.fillRect(0, 0, width, height)

    // Draw simplified world map
    drawMapOutline(ctx, width, height)

    // Draw hotspots
    const currentLocation = mapLocations[selectedLocation]
    const heatmapData = getHeatmapData(selectedLocation)
    
    heatmapData.forEach((spot) => {
      const [x, y] = latLngToCanvas(spot.lat, spot.lng, currentLocation.bounds, width, height)
      
      if (x >= 0 && x <= width && y >= 0 && y <= height) {
        const radius = Math.max(8, 20 * spot.intensity)

        // Create gradient for hotspot
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        const color = spot.intensity >= 0.8 ? '#ef4444' : spot.intensity >= 0.6 ? '#f97316' : '#f59e0b'
        gradient.addColorStop(0, color + '90')
        gradient.addColorStop(0.7, color + '40')
        gradient.addColorStop(1, color + '00')

        // Draw hotspot
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fill()

        // Draw center point
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, 2 * Math.PI)
        ctx.fill()

        // Draw city label for major incidents
        if (spot.intensity >= 0.7) {
          ctx.fillStyle = '#ffffff'
          ctx.font = '12px Inter, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(spot.city, x, y + radius + 15)
        }
      }
    })
  }

  const drawMapOutline = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Simplified continent outlines
    ctx.strokeStyle = '#334155'
    ctx.fillStyle = '#1e293b'
    ctx.lineWidth = 1

    if (selectedLocation === 'world') {
      // Draw simplified world continents
      const continents = [
        { x: width * 0.15, y: height * 0.25, w: width * 0.25, h: height * 0.35 },
        { x: width * 0.22, y: height * 0.55, w: width * 0.15, h: height * 0.35 },
        { x: width * 0.45, y: height * 0.2, w: width * 0.15, h: height * 0.2 },
        { x: width * 0.48, y: height * 0.35, w: width * 0.12, h: height * 0.4 },
        { x: width * 0.55, y: height * 0.15, w: width * 0.3, h: height * 0.5 },
        { x: width * 0.75, y: height * 0.7, w: width * 0.12, h: height * 0.15 }
      ]

      continents.forEach(continent => {
        ctx.beginPath()
        ctx.roundRect(continent.x, continent.y, continent.w, continent.h, 8)
        ctx.fill()
        ctx.stroke()
      })
    }
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Find clicked hotspot
    const heatmapData = getHeatmapData(selectedLocation)
    const currentLocation = mapLocations[selectedLocation]
    
    heatmapData.forEach((spot) => {
      const [spotX, spotY] = latLngToCanvas(spot.lat, spot.lng, currentLocation.bounds, rect.width, rect.height)
      const distance = Math.sqrt((x - spotX) ** 2 + (y - spotY) ** 2)
      const radius = Math.max(8, 20 * spot.intensity)

      if (distance <= radius) {
        setSelectedHotspot(spot)
      }
    })
  }

  useEffect(() => {
    const handleResize = () => {
      setTimeout(drawWorldMap, 100)
    }

    window.addEventListener('resize', handleResize)
    drawWorldMap()

    return () => window.removeEventListener('resize', handleResize)
  }, [selectedLocation])

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

  const totalIncidents = getHeatmapData(selectedLocation).reduce((sum, spot) => sum + spot.incidents, 0)
  const criticalZones = getHeatmapData(selectedLocation).filter(spot => spot.intensity >= 0.8).length
  const highRiskAreas = getHeatmapData(selectedLocation).filter(spot => spot.intensity >= 0.6 && spot.intensity < 0.8).length
  const safeZones = getHeatmapData(selectedLocation).filter(spot => spot.intensity < 0.6).length

  return (
    <div className="px-4 sm:px-0">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-purple-800">Global Safety Heatmap</CardTitle>
          <CardDescription>
            Real-world safety incident visualization. Click on red zones to view detailed information.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* Location Selector */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">View Region:</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(mapLocations).map(([key, location]) => (
                    <SelectItem key={key} value={key}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* World Map Canvas */}
              <div className="lg:col-span-2 space-y-4">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="w-full h-96 bg-slate-900 rounded-lg cursor-pointer shadow-inner border border-slate-700"
                    style={{ aspectRatio: '16/10' }}
                  />
                  
                  {/* Map Legend */}
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Critical Risk</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span>High Risk</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Details Panel */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-4">Location Details</h3>
                
                {!selectedHotspot ? (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <p className="text-sm">Click on a hotspot to view location details.</p>
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
                      <p className="text-sm text-gray-600 mb-1">{selectedHotspot.city}, {selectedHotspot.country}</p>
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

            {/* Regional Statistics */}
            <div className="border-t pt-6">
              <h3 className="font-bold text-lg mb-4">{mapLocations[selectedLocation].name} Safety Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-red-600">{totalIncidents}</p>
                  <p className="text-sm text-gray-600">Total Incidents</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-red-600">{criticalZones}</p>
                  <p className="text-sm text-gray-600">Critical Zones</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-orange-600">{highRiskAreas}</p>
                  <p className="text-sm text-gray-600">High Risk Areas</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-green-600">{safeZones}</p>
                  <p className="text-sm text-gray-600">Safer Areas</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}