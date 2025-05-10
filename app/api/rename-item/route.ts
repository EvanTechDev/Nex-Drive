import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { itemId, itemType, newName } = await request.json()

    if (!itemId || !itemType || !newName) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    if (itemType !== "file" && itemType !== "folder") {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 })
    }

    // Validate new name
    if (!/^[a-zA-Z0-9_\-. ]+$/.test(newName)) {
      return NextResponse.json(
        { error: "Invalid name. Use only letters, numbers, spaces, and the following characters: _ - ." },
        { status: 400 },
      )
    }

    try {
      // Rename the item
      await renameItemInMisskey(itemId, itemType, newName)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Error renaming item:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to rename item" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Function to rename an item in MISSKEY drive
async function renameItemInMisskey(itemId: string, itemType: "file" | "folder", newName: string) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  const endpoint = itemType === "file" ? "drive/files/update" : "drive/folders/update"

  const body: any = {
    i: apiKey,
    name: newName,
  }

  // Add the appropriate ID field based on item type
  if (itemType === "file") {
    body.fileId = itemId
  } else {
    body.folderId = itemId
  }

  const response = await fetch(`${apiUrl}/api/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let errorMessage = `Rename failed with status ${response.status}`

    try {
      const errorData = await response.json()
      errorMessage = errorData.error?.message || errorMessage
    } catch (jsonError) {
      // If JSON parsing fails, try to get text
      try {
        const errorText = await response.text()
        if (errorText) {
          errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`
        }
      } catch (textError) {
        // If text extraction fails, just use the status
        console.error("Failed to extract error text:", textError)
      }
    }

    throw new Error(errorMessage)
  }

  return true
}
