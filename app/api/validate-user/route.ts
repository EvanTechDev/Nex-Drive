import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Validate the user ID format
    if (userId.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters long" }, { status: 400 })
    }

    // Ensure the user's directory exists in MISSKEY drive
    try {
      await ensureUserDirectory(userId)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Error ensuring user directory:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to create user directory" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Function to ensure the user's directory exists in MISSKEY drive
async function ensureUserDirectory(userId: string) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  console.log("Creating directory structure for user:", userId)

  try {
    // First, create the base directory if it doesn't exist
    const baseDir = await createDirectoryIfNotExists(null, "drive")
    console.log("Base directory:", baseDir)

    // Then create the user directory if it doesn't exist
    const userDir = await createDirectoryIfNotExists(baseDir.id, userId)
    console.log("User directory:", userDir)

    // Finally create the data directory if it doesn't exist
    const dataDir = await createDirectoryIfNotExists(userDir.id, "data")
    console.log("Data directory:", dataDir)

    return true
  } catch (error) {
    console.error("Error in directory creation:", error)
    throw error
  }
}

// Helper function to create a directory if it doesn't exist
async function createDirectoryIfNotExists(parentId: string | null, name: string) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  console.log(`Checking if directory exists: ${name} (parent: ${parentId || "root"})`)

  try {
    // First, try to find the directory
    const findResponse = await fetch(`${apiUrl}/api/drive/folders/find`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        i: apiKey,
        name: name,
        parentId: parentId,
      }),
    })

    const findData = await findResponse.json()
    console.log(`Find response for ${name}:`, findData)

    // Check if we found the folder
    if (findResponse.ok && Array.isArray(findData) && findData.length > 0) {
      // Return the first matching folder
      return findData[0]
    }

    // If not found or error, create the folder
    console.log(`Creating directory: ${name} (parent: ${parentId || "root"})`)
    const createResponse = await fetch(`${apiUrl}/api/drive/folders/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        i: apiKey,
        name: name,
        parentId: parentId,
      }),
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.json()
      console.error(`Error creating directory ${name}:`, errorData)
      throw new Error(`Failed to create directory ${name}: ${JSON.stringify(errorData)}`)
    }

    const createData = await createResponse.json()
    console.log(`Created directory ${name}:`, createData)
    return createData
  } catch (error) {
    console.error(`Error processing directory ${name}:`, error)
    throw new Error(`Failed to process directory ${name}: ${error instanceof Error ? error.message : String(error)}`)
  }
}
