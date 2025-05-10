import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, query } = await request.json()

    if (!userId || !query || query.trim() === "") {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    try {
      // 搜索文件和文件夹
      const results = await searchItemsInMisskey(userId, query)
      return NextResponse.json({ success: true, results })
    } catch (error) {
      console.error("Error searching items:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to search items" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// 在MISSKEY中搜索项目
async function searchItemsInMisskey(userId: string, query: string) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  // 获取用户根目录ID
  const userDirId = await getUserDirectoryId(userId)

  // 搜索文件
  const filesResponse = await fetch(`${apiUrl}/api/drive/files`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      i: apiKey,
      query: query,
      limit: 100,
    }),
  })

  if (!filesResponse.ok) {
    const errorData = await filesResponse.json().catch(() => ({}))
    throw new Error(errorData.error?.message || "Failed to search files")
  }

  const files = await filesResponse.json()

  // 搜索文件夹
  const foldersResponse = await fetch(`${apiUrl}/api/drive/folders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      i: apiKey,
      name: query,
      limit: 100,
    }),
  })

  if (!foldersResponse.ok) {
    const errorData = await foldersResponse.json().catch(() => ({}))
    throw new Error(errorData.error?.message || "Failed to search folders")
  }

  const folders = await foldersResponse.json()

  // 格式化文件
  const formattedFiles = Array.isArray(files)
    ? files
        .filter((file: any) => {
          // 只包含用户目录下的文件
          if (!userDirId) return true // 如果无法确定用户目录，则包含所有文件
          return true // 暂时包含所有文件，后续可以根据需要过滤
        })
        .map((file: any) => ({
          id: file.id,
          name: file.name,
          type: "file",
          createdAt: file.createdAt,
          size: file.size,
          mimeType: file.type,
          thumbnailUrl: file.thumbnailUrl,
          folderId: file.folderId,
        }))
    : []

  // 格式化文件夹
  const formattedFolders = Array.isArray(folders)
    ? folders
        .filter((folder: any) => {
          // 只包含用户目录下的文件夹
          if (!userDirId) return true // 如果无法确定用户目录，则包含所有文件夹
          return true // 暂时包含所有文件夹，后续可以根据需要过滤
        })
        .map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          type: "folder",
          createdAt: folder.createdAt,
        }))
    : []

  // 合并结果
  return [...formattedFolders, ...formattedFiles]
}

// 获取用户目录ID
async function getUserDirectoryId(userId: string) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  // 首先，查找"drive"目录
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

  // 然后，查找用户目录
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
