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
      // Get item details
      const details = await getItemDetails(itemId, itemType)
      return NextResponse.json({ success: true, details })
    } catch (error) {
      console.error("Error getting item details:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to get item details" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Function to get item details from MISSKEY drive
async function getItemDetails(itemId: string, itemType: "file" | "folder") {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  const endpoint = itemType === "file" ? "drive/files/show" : "drive/folders/show"
  const body: any = {
    i: apiKey,
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
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `Failed to get ${itemType} details`)
  }

  const data = await response.json()

  // Format the response based on item type
  if (itemType === "file") {
    return {
      id: data.id,
      name: data.name,
      type: "file",
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      size: data.size,
      mimeType: data.type,
      thumbnailUrl: data.thumbnailUrl,
      url: data.url,
      properties: data.properties || {},
      folderId: data.folderId,
      isSensitive: data.isSensitive,
      blurhash: data.blurhash,
      comment: data.comment || "",
    }
  } else {
    return {
      id: data.id,
      name: data.name,
      type: "folder",
      createdAt: data.createdAt,
      parentId: data.parentId,
      foldersCount: data.foldersCount,
      filesCount: data.filesCount,
      description: data.description || "",
    }
  }
}
