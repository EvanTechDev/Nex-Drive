import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
    }

    try {
      // Get the base directory ID
      const baseDir = await getBaseDirId(userId)
      if (!baseDir) {
        // If the base directory doesn't exist, return an empty list
        return NextResponse.json({ collections: [] })
      }

      // List collections (top-level folders)
      const collections = await listCollections(baseDir)
      return NextResponse.json({ collections })
    } catch (error) {
      console.error("Error listing collections:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to list collections" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Function to get the base directory ID
async function getBaseDirId(userId: string) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  // First, find the "drive" directory
  const driveResponse = await fetch(`${apiUrl}/api/drive/folders/find`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      i: apiKey,
      name: "drive",
      parentId: null,
    }),
  })

  const driveFolders = await driveResponse.json()

  if (!Array.isArray(driveFolders) || driveFolders.length === 0) {
    return null
  }

  const driveFolder = driveFolders.find((f) => f.name === "drive")
  if (!driveFolder) return null

  // Then, find the user directory
  const userResponse = await fetch(`${apiUrl}/api/drive/folders/find`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      i: apiKey,
      name: userId,
      parentId: driveFolder.id,
    }),
  })

  const userFolders = await userResponse.json()

  if (!Array.isArray(userFolders) || userFolders.length === 0) {
    return null
  }

  const userFolder = userFolders.find((f) => f.name === userId)
  if (!userFolder) return null

  // Finally, find the data directory
  const dataResponse = await fetch(`${apiUrl}/api/drive/folders/find`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      i: apiKey,
      name: "data",
      parentId: userFolder.id,
    }),
  })

  const dataFolders = await dataResponse.json()

  if (!Array.isArray(dataFolders) || dataFolders.length === 0) {
    return null
  }

  const dataFolder = dataFolders.find((f) => f.name === "data")
  return dataFolder ? dataFolder.id : null
}

// Function to list collections (top-level folders)
async function listCollections(baseDirId: string) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  const response = await fetch(`${apiUrl}/api/drive/folders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      i: apiKey,
      folderId: baseDirId,
      parentId: baseDirId,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error("Error fetching collections:", errorData)
    throw new Error(`Failed to fetch collections: ${JSON.stringify(errorData)}`)
  }

  const folders = await response.json()

  if (!Array.isArray(folders)) {
    return []
  }

  return folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
  }))
}
