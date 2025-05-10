"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  Grid,
  LayoutGrid,
  Plus,
  Search,
  Upload,
  ArrowLeft,
  Loader2,
  MoreHorizontal,
  Trash2,
  List,
  FolderIcon,
  FileText,
  CheckCircle,
  XCircle,
  Download,
  Pencil,
  ImageIcon,
  Info,
  AlertTriangle,
  CheckSquare,
  Square,
  Move,
  X,
  FolderPlus,
  ChevronDown,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import FilePreview from "./file-preview"
import DragDropZone from "./drag-drop-zone"
import ItemDetailsDialog from "./item-details-dialog"
import FolderSelectDialog from "./folder-select-dialog"

interface NavItemProps {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
}

function NavItem({ href, icon, children, active, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg", active && "bg-gray-100")}
      onClick={(e) => {
        e.preventDefault()
        if (onClick) onClick()
      }}
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}

function FolderItem({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
      onClick={(e) => {
        e.preventDefault()
        if (onClick) onClick()
      }}
    >
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
      <span>{children}</span>
    </Link>
  )
}

interface FileCardProps {
  title: string
  metadata: string
  thumbnail: string
  onClick?: () => void
  onDelete?: () => void
  onRename?: () => void
  onDownload?: () => void
  onDetails?: () => void
  onMove?: () => void
  type: "file" | "folder"
  isSelected?: boolean
  onSelect?: () => void
  selectionMode?: boolean
}

function FileCard({
  title,
  metadata,
  thumbnail,
  onClick,
  onDelete,
  onRename,
  onDownload,
  onDetails,
  onMove,
  type,
  isSelected,
  onSelect,
  selectionMode,
}: FileCardProps) {
  return (
    <div
      className={cn("group relative overflow-hidden rounded-lg border bg-white", isSelected && "ring-2 ring-blue-500")}
    >
      {/* 始终显示checkbox，但在非选择模式下隐藏 */}
      <div
        className={cn(
          "absolute top-2 left-2 z-10 bg-white rounded-md shadow-sm p-1 cursor-pointer",
          !selectionMode && "opacity-0 group-hover:opacity-100",
        )}
        onClick={(e) => {
          e.stopPropagation()
          if (onSelect) onSelect()
        }}
      >
        {isSelected ? <CheckSquare className="h-5 w-5 text-blue-500" /> : <Square className="h-5 w-5 text-gray-400" />}
      </div>

      <div
        className="aspect-[4/3] overflow-hidden cursor-pointer"
        onClick={(e) => {
          if (selectionMode && onSelect) {
            e.stopPropagation()
            onSelect()
          } else if (onClick) {
            onClick()
          }
        }}
      >
        {type === "folder" ? (
          <div className="h-full w-full flex items-center justify-center bg-yellow-50">
            <svg className="w-24 h-24 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
        ) : (
          <Image
            src={thumbnail || "/placeholder.svg"}
            alt={title}
            width={400}
            height={300}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-4 flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900 truncate max-w-[180px]">{title}</h3>
          <p className="text-sm text-gray-500">{metadata}</p>
        </div>
        {!selectionMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDetails}>
                <Info className="h-4 w-4 mr-2" />
                Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRename}>
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMove}>
                <Move className="h-4 w-4 mr-2" />
                Move
              </DropdownMenuItem>
              {type === "file" && onDownload && (
                <DropdownMenuItem onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

interface FileListItemProps {
  item: FileItem
  onClick: () => void
  onDelete: () => void
  onRename: () => void
  onDownload?: () => void
  onDetails: () => void
  onMove: () => void
  isSelected?: boolean
  onSelect?: () => void
  selectionMode?: boolean
}

function FileListItem({
  item,
  onClick,
  onDelete,
  onRename,
  onDownload,
  onDetails,
  onMove,
  isSelected,
  onSelect,
  selectionMode,
}: FileListItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const formatSize = (size?: number) => {
    if (!size) return ""
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 px-4 hover:bg-gray-50 border-b",
        isSelected && "bg-blue-50",
      )}
    >
      <div className="flex items-center flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        {/* 始终显示checkbox */}
        <div
          className="mr-2 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            if (onSelect) onSelect()
          }}
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-blue-500" />
          ) : (
            <Square className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <div className="mr-3">
          {item.type === "folder" ? (
            <FolderIcon className="h-5 w-5 text-yellow-500" />
          ) : (
            <FileText className="h-5 w-5 text-blue-500" />
          )}
        </div>
        <div className="truncate">
          <p className="font-medium truncate">{item.name}</p>
          <p className="text-xs text-gray-500">
            {formatDate(item.createdAt)} • {item.type === "file" ? formatSize(item.size) : "Folder"}
          </p>
        </div>
      </div>
      {!selectionMode && (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onDetails()
            }}
          >
            <Info className="h-4 w-4 text-gray-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onMove()
            }}
          >
            <Move className="h-4 w-4 text-gray-500" />
          </Button>
          {item.type === "file" && onDownload && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onDownload()
              }}
            >
              <Download className="h-4 w-4 text-gray-500" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onRename()
            }}
          >
            <Pencil className="h-4 w-4 text-gray-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      )}
    </div>
  )
}

interface FileItem {
  id: string
  name: string
  type: "file" | "folder"
  createdAt: string
  size?: number
  mimeType?: string
  thumbnailUrl?: string
  folderId?: string
  url?: string
  isImage?: boolean
  isVideo?: boolean
}

interface UploadProgressItem {
  id: string
  name: string
  progress: number
  status: "uploading" | "success" | "error"
  error?: string
}

interface MisskeyFileManagerProps {
  userId: string
}

export default function MisskeyFileManager({ userId }: MisskeyFileManagerProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [items, setItems] = useState<FileItem[]>([])
  const [mediaFiles, setMediaFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoadingMedia, setIsLoadingMedia] = useState<boolean>(false)
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState<boolean>(false)
  const [newFolderName, setNewFolderName] = useState<string>("")
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgressItem[]>([])
  const { toast } = useToast()
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const [previewFileId, setPreviewFileId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [collections, setCollections] = useState<{ name: string; id: string }[]>([])
  const [itemToRename, setItemToRename] = useState<FileItem | null>(null)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState<boolean>(false)
  const [newItemName, setNewItemName] = useState<string>("")
  const [fileDetails, setFileDetails] = useState<Record<string, FileItem>>({})
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<"files" | "media">("files")
  const [itemDetailsId, setItemDetailsId] = useState<string | null>(null)
  const [itemDetailsType, setItemDetailsType] = useState<"file" | "folder" | null>(null)
  const [isNSFWDialogOpen, setIsNSFWDialogOpen] = useState<boolean>(false)
  const [nsfwFile, setNsfwFile] = useState<string | null>(null)

  // 批量操作相关状态
  const [selectionMode, setSelectionMode] = useState<boolean>(false)
  const [selectedItems, setSelectedItems] = useState<FileItem[]>([])
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState<boolean>(false)
  const [itemToMove, setItemToMove] = useState<FileItem | null>(null)
  const [isBatchMoveDialogOpen, setIsBatchMoveDialogOpen] = useState<boolean>(false)
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState<boolean>(false)

  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchResults, setSearchResults] = useState<FileItem[]>([])
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 文件上传引用
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get the current directory path string
  const getCurrentPathString = useCallback(() => {
    return `drive/${userId}${currentPath.length > 0 ? "/" + currentPath.join("/") : ""}`
  }, [userId, currentPath])

  const testConnection = async () => {
    try {
      const response = await fetch("/api/test-connection")
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Connection Successful",
          description: `Connected to ${data.serverInfo.name} (${data.apiVersion})`,
        })
      } else {
        toast({
          title: "Connection Failed",
          description: data.message,
          variant: "destructive",
        })
      }

      console.log("Connection test result:", data)
    } catch (error) {
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to test connection",
        variant: "destructive",
      })
    }
  }

  // Load collections (top-level folders)
  const loadCollections = useCallback(async () => {
    try {
      const response = await fetch("/api/list-collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load collections")
      }

      const data = await response.json()
      setCollections(data.collections || [])
    } catch (error) {
      console.error("Error loading collections:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load collections",
        variant: "destructive",
      })
    }
  }, [userId, toast])

  // Load media files
  const loadMediaFiles = useCallback(async () => {
    if (activeView !== "media") return

    setIsLoadingMedia(true)
    try {
      const response = await fetch("/api/scan-media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load media files")
      }

      const data = await response.json()
      setMediaFiles(data.mediaFiles || [])
    } catch (error) {
      console.error("Error loading media files:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load media files",
        variant: "destructive",
      })
    } finally {
      setIsLoadingMedia(false)
    }
  }, [userId, activeView, toast])

  // Update the loadItems function
  const loadItems = useCallback(async () => {
    if (activeView === "media") {
      loadMediaFiles()
      return
    }

    setIsLoading(true)
    setLoadError(null)

    try {
      const response = await fetch("/api/list-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          path: getCurrentPathString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load items")
      }

      const data = await response.json()

      // Store the current folder ID if available
      if (data.folderId) {
        setCurrentFolderId(data.folderId)
      }

      // Sort items: folders first, then files, both alphabetically
      const sortedItems = data.items.sort((a: FileItem, b: FileItem) => {
        // First sort by type (folders first)
        if (a.type !== b.type) {
          return a.type === "folder" ? -1 : 1
        }
        // Then sort alphabetically by name
        return a.name.localeCompare(b.name)
      })

      setItems(sortedItems)
    } catch (error) {
      console.error("Error loading items:", error)
      setLoadError(error instanceof Error ? error.message : "Failed to load items")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load items",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [userId, getCurrentPathString, toast, activeView, loadMediaFiles])

  // 搜索文件和文件夹
  const searchItems = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setIsSearchMode(false)
        return
      }

      setIsSearching(true)
      setIsSearchMode(true)

      try {
        const response = await fetch("/api/search-items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            query,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to search items")
        }

        const data = await response.json()

        // 排序结果：文件夹优先，然后按名称排序
        const sortedResults = data.results.sort((a: FileItem, b: FileItem) => {
          if (a.type !== b.type) {
            return a.type === "folder" ? -1 : 1
          }
          return a.name.localeCompare(b.name)
        })

        setSearchResults(sortedResults)
      } catch (error) {
        console.error("Error searching items:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to search items",
          variant: "destructive",
        })
      } finally {
        setIsSearching(false)
      }
    },
    [userId, toast],
  )

  // 处理搜索输入变化
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // 如果查询为空，退出搜索模式
    if (!query.trim()) {
      setIsSearchMode(false)
      setSearchResults([])
      return
    }

    // 设置新的定时器，延迟搜索以减少API调用
    searchTimeoutRef.current = setTimeout(() => {
      searchItems(query)
    }, 500)
  }

  // 清除搜索
  const clearSearch = () => {
    setSearchQuery("")
    setIsSearchMode(false)
    setSearchResults([])
  }

  // Load items when component mounts or path changes
  useEffect(() => {
    loadItems()
    // 退出搜索模式
    setIsSearchMode(false)
    setSearchQuery("")
  }, [loadItems, currentPath, activeView])

  // Load collections when component mounts
  useEffect(() => {
    loadCollections()
  }, [loadCollections])

  // 清理搜索定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Get file details for download
  const getFileDetails = useCallback(
    async (fileId: string) => {
      // Check if we already have the details cached
      if (fileDetails[fileId] && fileDetails[fileId].url) {
        return fileDetails[fileId]
      }

      try {
        const response = await fetch("/api/preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fileId }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to get file details")
        }

        const data = await response.json()

        // Cache the file details
        setFileDetails((prev) => ({
          ...prev,
          [fileId]: data.file,
        }))

        return data.file
      } catch (error) {
        console.error("Error getting file details:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to get file details",
          variant: "destructive",
        })
        return null
      }
    },
    [fileDetails, toast],
  )

  // Navigate to a folder
  const navigateToFolder = (folderName: string) => {
    setCurrentPath([...currentPath, folderName])
    setActiveView("files") // Switch to files view when navigating

    // 退出选择模式
    setSelectionMode(false)
    setSelectedItems([])
  }

  // Navigate to a specific collection
  const navigateToCollection = (collectionName: string) => {
    // Reset path and set to the collection
    setCurrentPath([collectionName])
    setActiveView("files") // Switch to files view when navigating

    // 退出选择模式
    setSelectionMode(false)
    setSelectedItems([])
  }

  // Navigate up one level
  const navigateUp = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1))

      // 退出选择模式
      setSelectionMode(false)
      setSelectedItems([])
    }
  }

  // Create a new folder
  const createFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      // First ensure the parent directory exists
      await ensureDirectoryExists(getCurrentPathString())

      const response = await fetch("/api/create-folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          path: getCurrentPathString(),
          folderName: newFolderName,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create folder")
      }

      toast({
        title: "Success",
        description: `Folder "${newFolderName}" created successfully`,
      })

      setNewFolderName("")
      setIsCreateFolderOpen(false)
      loadItems()
      loadCollections() // Refresh collections if we're at the root
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create folder",
        variant: "destructive",
      })
    }
  }

  // Ensure directory exists before uploading
  const ensureDirectoryExists = async (path: string) => {
    try {
      const response = await fetch("/api/ensure-directory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to ensure directory exists")
      }

      const result = await response.json()
      setCurrentFolderId(result.directoryId || null)
      return {
        success: true,
        directoryId: result.directoryId || null,
      }
    } catch (error) {
      console.error("Error ensuring directory exists:", error)
      throw error
    }
  }

  // 检查图片是否包含 NSFW 内容
  const checkNSFWContent = async (file: File): Promise<boolean> => {
    // 如果不是图片，跳过检查
    if (!file.type.startsWith("image/")) {
      return false
    }

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/check-nsfw", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        console.error("NSFW check failed:", response.statusText)
        return false // 如果检查失败，允许上传继续
      }

      const result = await response.json()
      console.log("NSFW check result:", result)

      return result.isNSFW
    } catch (error) {
      console.error("Error checking NSFW content:", error)
      return false // 如果发生错误，允许上传继续
    }
  }

  // 修改文件上传函数，添加 NSFW 检测
  const handleFileUpload = async (fileList: FileList) => {
    if (!fileList || fileList.length === 0) return

    setIsUploading(true)

    // 初始化进度跟踪
    const progressItems: UploadProgressItem[] = Array.from(fileList).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      progress: 0,
      status: "uploading",
    }))

    setUploadProgress(progressItems)

    try {
      // 确保目录存在
      const directoryResponse = await ensureDirectoryExists(getCurrentPathString())
      const folderId = directoryResponse.directoryId || null

      // 逐个上传文件
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        const progressItem = progressItems[i]

        try {
          // 更新进度
          setUploadProgress((prev) =>
            prev.map((item) => (item.id === progressItem.id ? { ...item, progress: 5 } : item)),
          )

          // 检查是否包含 NSFW 内容
          if (file.type.startsWith("image/")) {
            setUploadProgress((prev) =>
              prev.map((item) => (item.id === progressItem.id ? { ...item, progress: 10, status: "uploading" } : item)),
            )

            const isNSFW = await checkNSFWContent(file)

            if (isNSFW) {
              // 如果检测到 NSFW 内容，拒绝上传
              setNsfwFile(file.name)
              setIsNSFWDialogOpen(true)

              setUploadProgress((prev) =>
                prev.map((item) =>
                  item.id === progressItem.id
                    ? {
                        ...item,
                        status: "error",
                        error: "Content detected as inappropriate",
                      }
                    : item,
                ),
              )

              continue // 跳过此文件的上传
            }
          }

          // 获取上传令牌/URL
          const tokenResponse = await fetch("/api/get-upload-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              folderId: folderId,
              path: getCurrentPathString(),
            }),
          })

          if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json()
            throw new Error(errorData.error || "Failed to get upload token")
          }

          const { uploadUrl, apiKey, folderId: uploadFolderId } = await tokenResponse.json()

          // 创建用于直接上传到 Misskey 的 FormData
          const formData = new FormData()
          formData.append("i", apiKey)
          formData.append("file", file)
          if (uploadFolderId) {
            formData.append("folderId", uploadFolderId)
          }

          // 更新进度
          setUploadProgress((prev) =>
            prev.map((item) => (item.id === progressItem.id ? { ...item, progress: 20 } : item)),
          )

          console.log(`Uploading file directly to Misskey: ${file.name}, size: ${file.size}`)

          // 直接上传到 Misskey
          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            body: formData,
          })

          // 更新进度
          setUploadProgress((prev) =>
            prev.map((item) => (item.id === progressItem.id ? { ...item, progress: 80 } : item)),
          )

          // 检查响应是否成功
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            console.error(`Upload failed with status ${uploadResponse.status}:`, errorText)
            throw new Error(`Upload failed with status ${uploadResponse.status}`)
          }

          // 尝试解析响应
          let responseData
          try {
            responseData = await uploadResponse.json()
            console.log("Direct upload response:", responseData)
          } catch (jsonError) {
            console.error("Failed to parse response JSON:", jsonError)
            throw new Error("Invalid response from server")
          }

          // 更新进度为 100% 表示成功
          setUploadProgress((prev) =>
            prev.map((item) => (item.id === progressItem.id ? { ...item, progress: 100, status: "success" } : item)),
          )
          console.log(`File ${file.name} uploaded successfully`)
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error)

          // 更新进度以显示错误
          setUploadProgress((prev) =>
            prev.map((item) =>
              item.id === progressItem.id
                ? {
                    ...item,
                    status: "error",
                    error: error instanceof Error ? error.message : "Upload failed",
                  }
                : item,
            ),
          )
        }
      }

      // 检查是否有文件上传失败
      const failedFiles = progressItems.filter((item) => item.status === "error")

      if (failedFiles.length > 0) {
        if (failedFiles.length === fileList.length) {
          toast({
            title: "Error",
            description: "All files failed to upload",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Partial Success",
            description: `${fileList.length - failedFiles.length} of ${fileList.length} files uploaded successfully`,
          })
        }
      } else {
        toast({
          title: "Success",
          description: `${fileList.length} file(s) uploaded successfully`,
        })
      }

      // 短暂延迟后重新加载项目，以便服务器处理
      setTimeout(() => {
        loadItems()
        if (activeView === "media") {
          loadMediaFiles()
        }
      }, 1000)
    } catch (error) {
      console.error("Error in upload process:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      // 保持进度可见一段时间后再清除
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress([])
      }, 3000)
    }
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch("/api/delete-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: itemToDelete.id,
          itemType: itemToDelete.type,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to delete ${itemToDelete.type}`)
      }

      toast({
        title: "Success",
        description: `${itemToDelete.type === "folder" ? "Folder" : "File"} "${itemToDelete.name}" deleted successfully`,
      })

      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
      loadItems()
      if (activeView === "media") {
        loadMediaFiles()
      }
      loadCollections() // Refresh collections if we deleted a top-level folder
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  // 批量删除项目
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return

    try {
      // 逐个删除所选项目
      const results = await Promise.all(
        selectedItems.map(async (item) => {
          try {
            const response = await fetch("/api/delete-item", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                itemId: item.id,
                itemType: item.type,
              }),
            })

            if (!response.ok) {
              const data = await response.json()
              throw new Error(data.error || `Failed to delete ${item.type}`)
            }

            return { id: item.id, success: true }
          } catch (error) {
            console.error(`Error deleting ${item.type} ${item.id}:`, error)
            return {
              id: item.id,
              success: false,
              error: error instanceof Error ? error.message : "Failed to delete item",
            }
          }
        }),
      )

      // 检查结果
      const successCount = results.filter((result) => result.success).length
      const failureCount = results.length - successCount

      if (failureCount > 0) {
        if (successCount > 0) {
          toast({
            title: "Partial Success",
            description: `${successCount} of ${results.length} items deleted successfully`,
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to delete any items",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Success",
          description: `${successCount} item(s) deleted successfully`,
        })
      }

      // 关闭对话框并重置状态
      setIsBatchDeleteDialogOpen(false)
      setSelectionMode(false)
      setSelectedItems([])

      // 重新加载项目
      loadItems()
      if (activeView === "media") {
        loadMediaFiles()
      }
      loadCollections()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete items",
        variant: "destructive",
      })
    }
  }

  // 移动单个项目
  const handleMoveItem = async (targetFolderId: string, targetFolderPath: string) => {
    if (!itemToMove) return

    try {
      const response = await fetch("/api/move-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{ id: itemToMove.id, type: itemToMove.type }],
          targetFolderId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to move ${itemToMove.type}`)
      }

      const result = await response.json()

      if (result.successCount > 0) {
        toast({
          title: "Success",
          description: `${itemToMove.type === "folder" ? "Folder" : "File"} moved to ${targetFolderPath}`,
        })
      } else {
        toast({
          title: "Error",
          description: `Failed to move ${itemToMove.type}`,
          variant: "destructive",
        })
      }

      setIsMoveDialogOpen(false)
      setItemToMove(null)
      loadItems()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to move item",
        variant: "destructive",
      })
    }
  }

  // 批量移动项目
  const handleBatchMove = async (targetFolderId: string, targetFolderPath: string) => {
    if (selectedItems.length === 0) return

    try {
      const itemsToMove = selectedItems.map((item) => ({
        id: item.id,
        type: item.type,
      }))

      const response = await fetch("/api/move-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: itemsToMove,
          targetFolderId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to move items")
      }

      const result = await response.json()

      if (result.successCount === 0) {
        toast({
          title: "Error",
          description: "Failed to move any items",
          variant: "destructive",
        })
      } else if (result.successCount < selectedItems.length) {
        toast({
          title: "Partial Success",
          description: `${result.successCount} of ${selectedItems.length} items moved to ${targetFolderPath}`,
        })
      } else {
        toast({
          title: "Success",
          description: `${result.successCount} item(s) moved to ${targetFolderPath}`,
        })
      }

      setIsBatchMoveDialogOpen(false)
      setSelectionMode(false)
      setSelectedItems([])
      loadItems()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to move items",
        variant: "destructive",
      })
    }
  }

  const handleRenameItem = async () => {
    if (!itemToRename || !newItemName.trim()) return

    try {
      const response = await fetch("/api/rename-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: itemToRename.id,
          itemType: itemToRename.type,
          newName: newItemName,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to rename ${itemToRename.type}`)
      }

      toast({
        title: "Success",
        description: `${itemToRename.type === "folder" ? "Folder" : "File"} renamed successfully`,
      })

      setIsRenameDialogOpen(false)
      setItemToRename(null)
      setNewItemName("")
      loadItems()
      if (activeView === "media") {
        loadMediaFiles()
      }
      loadCollections() // Refresh collections if we renamed a top-level folder
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to rename item",
        variant: "destructive",
      })
    }
  }

  const handleDownloadFile = async (fileId: string) => {
    try {
      const fileDetail = await getFileDetails(fileId)

      if (!fileDetail || !fileDetail.url) {
        throw new Error("File URL not found")
      }

      // Create a temporary anchor element to trigger the download
      const link = document.createElement("a")
      link.href = fileDetail.url
      link.download = fileDetail.name || "download"
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download started",
        description: `Downloading ${fileDetail.name}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      })
    }
  }

  // 切换项目选择
  const toggleItemSelection = (item: FileItem) => {
    setSelectedItems((prev) => {
      const isSelected = prev.some((i) => i.id === item.id)
      if (isSelected) {
        return prev.filter((i) => i.id !== item.id)
      } else {
        return [...prev, item]
      }
    })
  }

  // 选择所有项目
  const selectAllItems = () => {
    const displayedItems = isSearchMode ? searchResults : activeView === "media" ? mediaFiles : items
    setSelectedItems(displayedItems)
  }

  // 取消选择所有项目
  const deselectAllItems = () => {
    setSelectedItems([])
  }

  // 切换选择模式
  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev)
    if (!selectionMode) {
      // 进入选择模式时清空选择
      setSelectedItems([])
    }
  }

  // 处理文件上传按钮点击
  const handleUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Determine which items to display based on the active view and search mode
  const displayItems = isSearchMode ? searchResults : activeView === "media" ? mediaFiles : items

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 border-r bg-white">
        <div className="p-4">
          <h1 className="text-xl font-bold">NexDrive</h1>

          {/* Create按钮 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full mt-4" style={{ backgroundColor: "#0066ff" }}>
                <Plus className="h-4 w-4 mr-2" />
                Create
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsCreateFolderOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleUploadButtonClick}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 隐藏的文件上传输入 */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            disabled={isUploading}
          />
        </div>
        <nav className="space-y-1 px-2">
          <NavItem
            href="#"
            icon={<LayoutGrid className="h-4 w-4" />}
            active={activeView === "files"}
            onClick={() => {
              setActiveView("files")
              clearSearch()
            }}
          >
            All Files
          </NavItem>
          <NavItem
            href="#"
            icon={<ImageIcon className="h-4 w-4" />}
            active={activeView === "media"}
            onClick={() => {
              setActiveView("media")
              loadMediaFiles()
              clearSearch()
            }}
          >
            Photos & Videos
          </NavItem>
          <div className="py-3">
            <div className="px-3 text-xs font-medium uppercase text-gray-500">Collections</div>
            <div className="mt-2">
              {collections.length > 0 ? (
                collections.map((collection) => (
                  <FolderItem key={collection.id} href="#" onClick={() => navigateToCollection(collection.name)}>
                    {collection.name}
                  </FolderItem>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">No collections found</div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <div className="w-96">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search files..."
                className="pl-9 pr-9"
                value={searchQuery}
                onChange={handleSearchInputChange}
              />
              {searchQuery && (
                <button className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700" onClick={clearSearch}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={testConnection} className="mr-2">
              Test Connection
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
            >
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
            <div className="h-8 w-8 overflow-hidden rounded-full">
              <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                {userId.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-auto">
          {/* 批量操作工具栏 */}
          {selectionMode && (
            <div className="mb-4 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{selectedItems.length} item(s) selected</span>
                <Button variant="outline" size="sm" onClick={selectAllItems}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllItems}>
                  Deselect All
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBatchMoveDialogOpen(true)}
                  disabled={selectedItems.length === 0}
                >
                  <Move className="h-4 w-4 mr-1" />
                  Move
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setIsBatchDeleteDialogOpen(true)}
                  disabled={selectedItems.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleSelectionMode}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!selectionMode && !isSearchMode && activeView === "files" && (
            <div className="mb-6 flex items-center gap-4">
              {currentPath.length > 0 && (
                <Button variant="outline" className="gap-2" onClick={navigateUp}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <Button variant="outline" className="gap-2" onClick={toggleSelectionMode}>
                <CheckSquare className="h-4 w-4" />
                Select
              </Button>
            </div>
          )}

          {/* 搜索模式标题 */}
          {isSearchMode && (
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-medium">Search results for "{searchQuery}"</h2>
                <span className="text-sm text-gray-500">({searchResults.length} items)</span>
              </div>
              <Button variant="outline" size="sm" onClick={clearSearch}>
                <X className="h-4 w-4 mr-1" />
                Clear Search
              </Button>
            </div>
          )}

          {/* Path breadcrumb */}
          {currentPath.length > 0 && activeView === "files" && !isSearchMode && (
            <div className="mb-4 text-sm text-gray-500">
              <span>Path: </span>
              <button className="hover:underline text-blue-600" onClick={() => setCurrentPath([])}>
                root
              </button>
              {currentPath.map((folder, index) => (
                <span key={index}>
                  <span className="mx-1">/</span>
                  <button
                    className="hover:underline text-blue-600"
                    onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                  >
                    {folder}
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Upload progress */}
          {uploadProgress.length > 0 && (
            <div className="mb-6 border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium mb-3">Uploading Files</h3>
              <div className="space-y-3">
                {uploadProgress.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm truncate max-w-[300px]">{item.name}</span>
                      <span className="text-xs text-gray-500 flex items-center">
                        {item.status === "uploading" && `${item.progress}%`}
                        {item.status === "success" && <CheckCircle className="h-4 w-4 text-green-500 ml-1" />}
                        {item.status === "error" && <XCircle className="h-4 w-4 text-red-500 ml-1" />}
                      </span>
                    </div>
                    <Progress value={item.progress} className="h-1" />
                    {item.status === "error" && <p className="text-xs text-red-500">{item.error || "Upload failed"}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content area */}
          {(isLoading && activeView === "files") || (isLoadingMedia && activeView === "media") || isSearching ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : loadError ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{loadError}</p>
              <Button onClick={loadItems}>Retry</Button>
            </div>
          ) : displayItems.length === 0 ? (
            <div>
              <div className="text-center py-4 text-gray-500 mb-4">
                {isSearchMode
                  ? "No search results found"
                  : activeView === "media"
                    ? "No media files found"
                    : "This folder is empty"}
              </div>
              {activeView === "files" && !isSearchMode && (
                <DragDropZone
                  onUpload={handleFileUpload}
                  isUploading={isUploading}
                  currentPath={getCurrentPathString()}
                  folderId={currentFolderId}
                />
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayItems.map((item) => (
                <FileCard
                  key={item.id}
                  title={item.name}
                  metadata={
                    item.type === "folder"
                      ? "Folder"
                      : `${item.mimeType?.split("/")[0] || "File"} • ${item.size ? (item.size / 1024).toFixed(2) + " KB" : ""}`
                  }
                  thumbnail={item.thumbnailUrl || "/placeholder.svg"}
                  type={item.type}
                  onClick={() => {
                    if (item.type === "folder") {
                      navigateToFolder(item.name)
                    } else {
                      setPreviewFileId(item.id)
                    }
                  }}
                  onDelete={() => {
                    setItemToDelete(item)
                    setIsDeleteDialogOpen(true)
                  }}
                  onRename={() => {
                    setItemToRename(item)
                    setNewItemName(item.name)
                    setIsRenameDialogOpen(true)
                  }}
                  onMove={() => {
                    setItemToMove(item)
                    setIsMoveDialogOpen(true)
                  }}
                  onDownload={item.type === "file" ? () => handleDownloadFile(item.id) : undefined}
                  onDetails={() => {
                    setItemDetailsId(item.id)
                    setItemDetailsType(item.type)
                  }}
                  isSelected={selectedItems.some((i) => i.id === item.id)}
                  onSelect={() => toggleItemSelection(item)}
                  selectionMode={selectionMode}
                />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {displayItems.map((item) => (
                <FileListItem
                  key={item.id}
                  item={item}
                  onClick={() => {
                    if (item.type === "folder") {
                      navigateToFolder(item.name)
                    } else {
                      setPreviewFileId(item.id)
                    }
                  }}
                  onDelete={() => {
                    setItemToDelete(item)
                    setIsDeleteDialogOpen(true)
                  }}
                  onRename={() => {
                    setItemToRename(item)
                    setNewItemName(item.name)
                    setIsRenameDialogOpen(true)
                  }}
                  onMove={() => {
                    setItemToMove(item)
                    setIsMoveDialogOpen(true)
                  }}
                  onDownload={item.type === "file" ? () => handleDownloadFile(item.id) : undefined}
                  onDetails={() => {
                    setItemDetailsId(item.id)
                    setItemDetailsType(item.type)
                  }}
                  isSelected={selectedItems.some((i) => i.id === item.id)}
                  onSelect={() => toggleItemSelection(item)}
                  selectionMode={selectionMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input placeholder="Folder name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {itemToRename?.type === "folder" ? "Folder" : "File"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input placeholder="New name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameItem}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Item Dialog */}
      <FolderSelectDialog
        isOpen={isMoveDialogOpen}
        onClose={() => setIsMoveDialogOpen(false)}
        onSelect={handleMoveItem}
        userId={userId}
        currentFolderId={itemToMove?.id}
      />

      {/* Batch Move Dialog */}
      <FolderSelectDialog
        isOpen={isBatchMoveDialogOpen}
        onClose={() => setIsBatchMoveDialogOpen(false)}
        onSelect={handleBatchMove}
        userId={userId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {itemToDelete?.type === "folder" ? "folder" : "file"}{" "}
              <span className="font-medium">{itemToDelete?.name}</span>
              {itemToDelete?.type === "folder" && " and all its contents"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Delete Confirmation Dialog */}
      <AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItems.length} items?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* File Preview Dialog */}
      <FilePreview fileId={previewFileId} onClose={() => setPreviewFileId(null)} />

      {/* Item Details Dialog */}
      <ItemDetailsDialog
        itemId={itemDetailsId}
        itemType={itemDetailsType}
        onClose={() => {
          setItemDetailsId(null)
          setItemDetailsType(null)
        }}
      />

      {/* NSFW 内容警告对话框 */}
      <AlertDialog open={isNSFWDialogOpen} onOpenChange={setIsNSFWDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              Inappropriate Content Detected
            </AlertDialogTitle>
            <AlertDialogDescription>
              The file <span className="font-medium">{nsfwFile}</span> appears to contain inappropriate content and has
              been blocked from uploading.
              <div className="mt-2 p-3 bg-red-50 rounded-md text-sm">
                Our system detected potentially explicit or inappropriate content in this image. To maintain a safe
                environment, the upload has been blocked.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsNSFWDialogOpen(false)}>Understand</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
