import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Read the request body only once
    const requestData = await request.json()
    const { fileName, fileType, fileSize, folderId, path } = requestData

    if (!fileName || !fileType) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const apiUrl = process.env.MISSKEY_API_URL
    const apiKey = process.env.MISSKEY_API_KEY

    if (!apiUrl || !apiKey) {
      return NextResponse.json({ error: "MISSKEY API configuration is missing" }, { status: 500 })
    }

    // Return the necessary information for direct upload
    return NextResponse.json({
      success: true,
      uploadUrl: `${apiUrl}/api/drive/files/create`,
      apiKey: apiKey, // Note: In a production environment, consider using a more secure approach
      folderId: folderId,
      fileName: fileName,
    })
  } catch (error) {
    console.error("Error generating upload token:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate upload token" },
      { status: 500 },
    )
  }
}
