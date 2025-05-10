import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, limit = 10 } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
    }

    try {
      // Get recent files
      const recentFiles = await getRecentFiles(userId, limit)
      return NextResponse.json({ files: recentFiles })
    } catch (error) {
      console.error("Error getting recent files:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to get recent files" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Function to get recent files
async function getRecentFiles(userId: string, limit: number) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  // Get all files for the user, sorted by creation date
  const response = await fetch(`${apiUrl}/api/drive/files`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      i: apiKey,
      limit: limit,
      sort: "-createdAt", // Sort by creation date, newest first
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || "Failed to get recent files")
  }

  const files = await response.json()

  if (!Array.isArray(files)) {
    return []
  }

  // Format the files
  return files.map((file) => ({
    id: file.id,
    name: file.name,
    type: "file",
    createdAt: file.createdAt,
    size: file.size,
    mimeType: file.type,
    thumbnailUrl: file.thumbnailUrl,
    folderId: file.folderId,
  }))
}
