import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { itemId, itemType } = await request.json()

    if (!itemId || !itemType) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    if (itemType !== "file" && itemType !== "folder") {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 })
    }

    try {
      // Delete the item
      await deleteItemFromMisskey(itemId, itemType)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Error deleting item:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to delete item" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Function to delete an item from MISSKEY drive
async function deleteItemFromMisskey(itemId: string, itemType: "file" | "folder") {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  const endpoint = itemType === "file" ? "drive/files/delete" : "drive/folders/delete"

  const response = await fetch(`${apiUrl}/api/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      i: apiKey,
      fileId: itemType === "file" ? itemId : undefined,
      folderId: itemType === "folder" ? itemId : undefined,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `Failed to delete ${itemType}`)
  }

  return true
}
