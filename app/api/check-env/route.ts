import { NextResponse } from "next/server"

export async function GET() {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  const success = !!apiUrl && !!apiKey

  // If we have the environment variables, try to make a simple API call to verify they work
  if (success) {
    try {
      const response = await fetch(`${apiUrl}/api/meta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          i: apiKey,
        }),
      })

      if (!response.ok) {
        return NextResponse.json({
          success: false,
          message: "MISSKEY API credentials are invalid or the API is not accessible",
        })
      }

      // Successfully connected to the API
      return NextResponse.json({
        success: true,
        message: "MISSKEY API configuration is valid",
      })
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: "Failed to connect to MISSKEY API",
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return NextResponse.json({
    success,
    message: success ? "MISSKEY API configuration is valid" : "MISSKEY API configuration is missing",
  })
}
