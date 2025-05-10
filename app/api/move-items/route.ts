import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { items, targetFolderId } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0 || !targetFolderId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    try {
      // 移动所有项目
      const results = await Promise.all(
        items.map(async (item) => {
          try {
            await moveItemInMisskey(item.id, item.type, targetFolderId)
            return { id: item.id, success: true }
          } catch (error) {
            console.error(`Error moving ${item.type} ${item.id}:`, error)
            return {
              id: item.id,
              success: false,
              error: error instanceof Error ? error.message : "Failed to move item",
            }
          }
        }),
      )

      // 检查是否所有项目都移动成功
      const allSuccess = results.every((result) => result.success)
      const successCount = results.filter((result) => result.success).length

      return NextResponse.json({
        success: successCount > 0,
        allSuccess,
        successCount,
        totalCount: items.length,
        results,
      })
    } catch (error) {
      console.error("Error moving items:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to move items" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// 在MISSKEY中移动项目
async function moveItemInMisskey(itemId: string, itemType: "file" | "folder", targetFolderId: string) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  // 修复：为文件夹使用正确的API参数
  if (itemType === "folder") {
    const response = await fetch(`${apiUrl}/api/drive/folders/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        i: apiKey,
        folderId: itemId,
        parentId: targetFolderId, // 使用parentId而不是folderId
      }),
    })

    if (!response.ok) {
      let errorMessage = `Move failed with status ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error?.message || errorMessage
      } catch (jsonError) {
        try {
          const errorText = await response.text()
          if (errorText) {
            errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`
          }
        } catch (textError) {
          console.error("Failed to extract error text:", textError)
        }
      }
      throw new Error(errorMessage)
    }
    return true
  } else {
    // 文件移动逻辑保持不变
    const response = await fetch(`${apiUrl}/api/drive/files/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        i: apiKey,
        fileId: itemId,
        folderId: targetFolderId,
      }),
    })

    if (!response.ok) {
      let errorMessage = `Move failed with status ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error?.message || errorMessage
      } catch (jsonError) {
        try {
          const errorText = await response.text()
          if (errorText) {
            errorMessage = `${errorMessage}: ${errorText.substring(0, 100)}`
          }
        } catch (textError) {
          console.error("Failed to extract error text:", textError)
        }
      }
      throw new Error(errorMessage)
    }
    return true
  }
}
