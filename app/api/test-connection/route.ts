import { NextResponse } from "next/server"

export async function GET() {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    return NextResponse.json({
      success: false,
      message: "MISSKEY API configuration is missing",
    })
  }

  try {
    // Test a simple API call
    const response = await fetch(`${apiUrl}/api/meta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        i: apiKey,
      }),
    })

    // Get the raw response
    const responseText = await response.text()

    // Try to parse as JSON
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      return NextResponse.json({
        success: false,
        message: "Server returned non-JSON response",
        rawResponse: responseText.substring(0, 500),
      })
    }

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: "API request failed",
        status: response.status,
        response: responseData,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Connection successful",
      apiVersion: responseData.version || "unknown",
      serverInfo: {
        name: responseData.name || "unknown",
        url: apiUrl,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Failed to connect to MISSKEY API",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
