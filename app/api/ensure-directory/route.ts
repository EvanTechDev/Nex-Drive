import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { path } = await request.json()

    if (!path) {
      return NextResponse.json({ error: "Missing path parameter" }, { status: 400 })
    }

    try {
      // Ensure the directory exists
      const result = await ensureDirectoryPath(path)
      return NextResponse.json({ success: true, directoryId: result })
    } catch (error) {
      console.error("Error ensuring directory exists:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to ensure directory exists" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Function to ensure a directory path exists
async function ensureDirectoryPath(path: string) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  console.log(`Ensuring directory path exists: ${path}`)

  // Split the path into components
  const pathComponents = path.split("/").filter(Boolean)
  console.log("Path components:", pathComponents)

  let currentFolderId: string | null = null

  // Traverse the path and create directories as needed
  for (const component of pathComponents) {
    try {
      // First, try to find the directory
      const findResponse = await fetch(`${apiUrl}/api/drive/folders/find`, {
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

      const findData = await findResponse.json()
      console.log(`Find response for ${component}:`, findData)

      // Check if we found the folder
      if (findResponse.ok && Array.isArray(findData) && findData.length > 0) {
        // Find the exact folder match
        const folder = findData.find((f) => f.name === component)
        if (folder) {
          currentFolderId = folder.id
          console.log(`Found existing folder ${component} with ID: ${currentFolderId}`)
          continue
        }
      }

      // If not found, create the folder
      console.log(`Creating directory: ${component} (parent: ${currentFolderId || "root"})`)
      const createResponse = await fetch(`${apiUrl}/api/drive/folders/create`, {
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

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        console.error(`Error creating directory ${component}:`, errorData)
        throw new Error(`Failed to create directory ${component}: ${JSON.stringify(errorData)}`)
      }

      const createData = await createResponse.json()
      console.log(`Created directory ${component}:`, createData)
      currentFolderId = createData.id
    } catch (error) {
      console.error(`Error processing directory ${component}:`, error)
      throw new Error(
        `Failed to process directory ${component}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  return currentFolderId
}
