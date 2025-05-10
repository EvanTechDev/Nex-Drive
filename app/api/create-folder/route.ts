import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, path, folderName } = await request.json()

    if (!userId || !path || !folderName) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Validate folder name
    if (!/^[a-zA-Z0-9_\-. ]+$/.test(folderName)) {
      return NextResponse.json(
        { error: "Invalid folder name. Use only letters, numbers, spaces, and the following characters: _ - ." },
        { status: 400 },
      )
    }

    try {
      // Get the parent folder ID
      const parentFolderId = await getFolderIdFromPath(path)
      if (!parentFolderId) {
        return NextResponse.json({ error: "Parent directory not found" }, { status: 404 })
      }

      // Create the folder
      await createFolderInMisskey(parentFolderId, folderName)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Error creating folder:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to create folder" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Function to get folder ID from path
async function getFolderIdFromPath(path: string) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  console.log(`Getting folder ID for path: ${path}`)

  // Split the path into components
  const pathComponents = path.split("/").filter(Boolean)
  console.log("Path components:", pathComponents)

  let currentFolderId: string | null = null

  // Traverse the path to find the final folder ID
  for (const component of pathComponents) {
    try {
      const response = await fetch(`${apiUrl}/api/drive/folders/find`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          i: apiKey,
          name: component,
          parentId: currentFolderId,
        }),
      })

      const folders = await response.json()
      console.log(`Find response for ${component}:`, folders)

      if (!Array.isArray(folders) || folders.length === 0) {
        console.log(`Folder not found: ${component}`)
        return null // Folder not found
      }

      // Find the exact folder match
      const folder = folders.find((f) => f.name === component)
      if (!folder) {
        console.log(`Exact folder match not found for: ${component}`)
        return null // Folder not found
      }

      currentFolderId = folder.id
      console.log(`Found folder ${component} with ID: ${currentFolderId}`)
    } catch (error) {
      console.error(`Error finding folder ${component}:`, error)
      return null
    }
  }

  return currentFolderId
}

// Function to create a folder in MISSKEY drive
async function createFolderInMisskey(parentFolderId: string, folderName: string) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  console.log(`Creating folder "${folderName}" in parent: ${parentFolderId}`)

  const response = await fetch(`${apiUrl}/api/drive/folders/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      i: apiKey,
      name: folderName,
      parentId: parentFolderId,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error("Error creating folder:", errorData)
    throw new Error(errorData.error?.message || `Failed to create folder: ${folderName}`)
  }

  const result = await response.json()
  console.log(`Created folder "${folderName}":`, result)
  return result
}
