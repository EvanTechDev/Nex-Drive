import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: "Missing file ID" }, { status: 400 })
    }

    try {
      // Get file details
      const fileDetails = await getFileDetails(fileId)
      return NextResponse.json({ success: true, file: fileDetails })
    } catch (error) {
      console.error("Error getting file preview:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to get file preview" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Function to get file details from MISSKEY drive
async function getFileDetails(fileId: string) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  const response = await fetch(`${apiUrl}/api/drive/files/show`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      i: apiKey,
      fileId: fileId,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || "Failed to get file details")
  }

  return response.json()
}
