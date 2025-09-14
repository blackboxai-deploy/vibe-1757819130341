import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Simulate AI response with safety-focused content
    const response = generateSafetyResponse(message.toLowerCase())

    return NextResponse.json({ 
      response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

function generateSafetyResponse(input: string): string {
  if (input.includes('emergency') || input.includes('help') || input.includes('danger')) {
    return `🚨 If you're in immediate danger, please call emergency services (911) right away or use the emergency button in the app.

For non-immediate emergencies:
• Use the emergency button in the app
• Start location sharing with contacts
• Begin voice/video recording for evidence
• Contact your emergency contacts

What specific help do you need?`
  }

  if (input.includes('safe') && (input.includes('walk') || input.includes('route'))) {
    return `🛡️ **Safety Tips for Walking:**

**Before leaving:**
• Check the safety heatmap
• Share location with contacts
• Plan safe routes

**While walking:**
• Stay alert and confident
• Trust your instincts
• Stay in well-lit areas

**Use Secure Sakhi:**
• Keep location tracking on
• Enable voice detection
• Have emergency contacts ready`
  }

  const responses = [
    `I'm your AI safety assistant. I can help with:

🆘 Emergency procedures
📍 Location tracking
🎙️ Voice/video recording
🗺️ Safety heatmap
🛡️ Personal safety tips

What would you like to know?`,

    `Welcome to Secure Sakhi! I can assist with:

• App features and settings
• Emergency response procedures  
• Safety tips and best practices
• Understanding safety data

How can I help keep you safe today?`
  ]
  
  return responses[Math.floor(Math.random() * responses.length)]
}