import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, path } = await request.json()

    if (!userId || !path) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    try {
      // Get the folder ID for the specified path
      const folderId = await getFolderIdFromPath(path)
      if (!folderId) {
        // If the folder doesn't exist, return an empty list instead of an error
        console.log(`Directory not found: ${path}, returning empty list`)
        return NextResponse.json({ items: [] })
      }

      // List items in the folder
      const items = await listItemsFromMisskey(folderId)
      return NextResponse.json({
        items,
        folderId: folderId,
      })
    } catch (error) {
      console.error("Error listing items:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to list items" },
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

// Function to list items from MISSKEY drive
async function listItemsFromMisskey(folderId: string) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  console.log(`Listing items in folder: ${folderId}`)

  try {
    // Get folders in the current directory
    // Using the standard folders endpoint with a parentId filter instead of /children
    const foldersResponse = await fetch(`${apiUrl}/api/drive/folders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        i: apiKey,
        folderId: folderId,
        // Some MISSKEY instances might use parentId instead of folderId
        parentId: folderId,
      }),
    })

    if (!foldersResponse.ok) {
      const errorData = await foldersResponse.json()
      console.error("Error fetching folders:", errorData)
      throw new Error(`Failed to fetch folders: ${JSON.stringify(errorData)}`)
    }

    const folders = await foldersResponse.json()
    console.log(`Found ${Array.isArray(folders) ? folders.length : 0} folders`)

    // Get files in the current directory
    const filesResponse = await fetch(`${apiUrl}/api/drive/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        i: apiKey,
        folderId: folderId,
      }),
    })

    if (!filesResponse.ok) {
      const errorData = await filesResponse.json()
      console.error("Error fetching files:", errorData)
      throw new Error(`Failed to fetch files: ${JSON.stringify(errorData)}`)
    }

    const files = await filesResponse.json()
    console.log(`Found ${Array.isArray(files) ? files.length : 0} files`)

    // Format folders
    const formattedFolders = Array.isArray(folders)
      ? folders.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          type: "folder",
          createdAt: folder.createdAt,
        }))
      : []

    // Format files
    const formattedFiles = Array.isArray(files)
      ? files.map((file: any) => ({
          id: file.id,
          name: file.name,
          type: "file",
          createdAt: file.createdAt,
          size: file.size,
          mimeType: file.type,
          thumbnailUrl: file.thumbnailUrl,
        }))
      : []

    // Combine and return all items
    return [...formattedFolders, ...formattedFiles]
  } catch (error) {
    console.error("Error in listItemsFromMisskey:", error)
    throw error
  }
}
