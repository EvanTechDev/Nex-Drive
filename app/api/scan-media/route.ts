import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
    }

    try {
      // Scan for media files
      const mediaFiles = await scanMediaFiles(userId)
      return NextResponse.json({ success: true, mediaFiles })
    } catch (error) {
      console.error("Error scanning media files:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to scan media files" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Function to scan for media files in MISSKEY drive
async function scanMediaFiles(userId: string) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  console.log(`Scanning media files for user: ${userId}`)

  // First, get the base directory ID for the user
  const baseDir = await getUserDirectoryId(userId)
  console.log(`User directory ID: ${baseDir || "not found"}`)

  // Get all files recursively
  const allFiles = await getAllFilesRecursively(baseDir)
  console.log(`Found ${allFiles.length} total files`)

  // Filter for image and video files
  const mediaFiles = allFiles.filter((file) => {
    const mimeType = file.type || ""
    return mimeType.startsWith("image/") || mimeType.startsWith("video/")
  })

  console.log(`Found ${mediaFiles.length} media files`)

  // Format the files
  return mediaFiles.map((file) => ({
    id: file.id,
    name: file.name,
    type: "file",
    createdAt: file.createdAt,
    size: file.size,
    mimeType: file.type,
    thumbnailUrl: file.thumbnailUrl,
    url: file.url,
    isImage: file.type?.startsWith("image/") || false,
    isVideo: file.type?.startsWith("video/") || false,
    folderId: file.folderId,
  }))
}

// Helper function to get the user's directory ID
async function getUserDirectoryId(userId: string) {
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
  return userFolder ? userFolder.id : null
}

// Helper function to get all files recursively
async function getAllFilesRecursively(folderId: string | null) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  // If no folder ID, return empty array
  if (!folderId) {
    return []
  }

  // Get files in the current folder
  const filesResponse = await fetch(`${apiUrl}/api/drive/files`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      i: apiKey,
      folderId: folderId,
      limit: 100, // Adjust as needed
    }),
  })

  if (!filesResponse.ok) {
    console.error(`Error fetching files for folder ${folderId}: ${filesResponse.status}`)
    return []
  }

  const files = await filesResponse.json()
  let allFiles = Array.isArray(files) ? [...files] : []

  // Get subfolders
  const foldersResponse = await fetch(`${apiUrl}/api/drive/folders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      i: apiKey,
      folderId: folderId,
      parentId: folderId,
    }),
  })

  if (!foldersResponse.ok) {
    console.error(`Error fetching subfolders for folder ${folderId}: ${foldersResponse.status}`)
    return allFiles
  }

  const folders = await foldersResponse.json()

  // Recursively get files from subfolders
  if (Array.isArray(folders)) {
    for (const folder of folders) {
      const subfolderFiles = await getAllFilesRecursively(folder.id)
      allFiles = [...allFiles, ...subfolderFiles]
    }
  }

  return allFiles
}
