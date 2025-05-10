"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  Bell,
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
  Clock,
  FolderIcon,
  FileText,
  CheckCircle,
  XCircle,
  Download,
  Pencil,
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
  type: "file" | "folder"
}

function FileCard({ title, metadata, thumbnail, onClick, onDelete, onRename, onDownload, type }: FileCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-white">
      <div className="aspect-[4/3] overflow-hidden cursor-pointer" onClick={onClick}>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="h-4 w-4 mr-2" />
              Rename
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
}

function FileListItem({ item, onClick, onDelete, onRename, onDownload }: FileListItemProps) {
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
    <div className="flex items-center justify-between py-2 px-4 hover:bg-gray-50 border-b">
      <div className="flex items-center flex-1 min-w-0 cursor-pointer" onClick={onClick}>
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
      <div className="flex items-center">
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
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoadingRecent, setIsLoadingRecent] = useState<boolean>(false)
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState<boolean>(false)
  const [newFolderName, setNewFolderName] = useState<string>("")
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgressItem[]>([])
  const { toast } = useToast()
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const [previewFileId, setPreviewFileId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("folder")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [collections, setCollections] = useState<{ name: string; id: string }[]>([])
  const [itemToRename, setItemToRename] = useState<FileItem | null>(null)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState<boolean>(false)
  const [newItemName, setNewItemName] = useState<string>("")
  const [fileDetails, setFileDetails] = useState<Record<string, FileItem>>({})

  // Get the current directory path string
  const getCurrentPathString = useCallback(() => {
    return `drive/${userId}/data${currentPath.length > 0 ? "/" + currentPath.join("/") : ""}`
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

  // Load recent files
  const loadRecentFiles = useCallback(async () => {
    if (activeTab !== "recent") return

    setIsLoadingRecent(true)
    try {
      const response = await fetch("/api/recent-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          limit: 20,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load recent files")
      }

      const data = await response.json()
      setRecentFiles(data.files || [])
    } catch (error) {
      console.error("Error loading recent files:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load recent files",
        variant: "destructive",
      })
    } finally {
      setIsLoadingRecent(false)
    }
  }, [userId, activeTab, toast])

  // Update the loadItems function
  const loadItems = useCallback(async () => {
    if (activeTab === "recent") {
      loadRecentFiles()
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
  }, [userId, getCurrentPathString, toast, activeTab, loadRecentFiles])

  // Load items when component mounts or path changes
  useEffect(() => {
    loadItems()
  }, [loadItems, currentPath, activeTab])

  // Load collections when component mounts
  useEffect(() => {
    loadCollections()
  }, [loadCollections])

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
    setActiveTab("folder") // Switch to folder view when navigating
  }

  // Navigate to a specific collection
  const navigateToCollection = (collectionName: string) => {
    // Reset path and set to the collection
    setCurrentPath([collectionName])
    setActiveTab("folder") // Switch to folder view when navigating
  }

  // Navigate up one level
  const navigateUp = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1))
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

      return true
    } catch (error) {
      console.error("Error ensuring directory exists:", error)
      throw error
    }
  }

  // Update the handleFileUpload function to handle large files and show progress
  const handleFileUpload = async (fileList: FileList) => {
    if (!fileList || fileList.length === 0) return

    setIsUploading(true)

    // Initialize progress tracking for each file
    const progressItems: UploadProgressItem[] = Array.from(fileList).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      progress: 0,
      status: "uploading",
    }))

    setUploadProgress(progressItems)

    try {
      // First ensure the directory exists
      await ensureDirectoryExists(getCurrentPathString())

      // Upload files one by one to track progress
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        const progressItem = progressItems[i]

        try {
          // Update progress to show we're starting
          setUploadProgress((prev) =>
            prev.map((item) => (item.id === progressItem.id ? { ...item, progress: 5 } : item)),
          )

          // Create a FormData for this specific file
          const formData = new FormData()
          formData.append("userId", userId)
          formData.append("path", getCurrentPathString())
          formData.append("files", file)

          console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`)

          // Send the upload request
          const response = await fetch("/api/upload-files", {
            method: "POST",
            body: formData,
          })

          // Check if the response is ok
          if (!response.ok) {
            const errorText = await response.text()
            console.error(`Upload failed with status ${response.status}:`, errorText)
            throw new Error(`Upload failed with status ${response.status}`)
          }

          // Parse the response
          let responseData
          try {
            responseData = await response.json()
            console.log("Upload response:", responseData)
          } catch (jsonError) {
            console.error("Failed to parse response JSON:", jsonError)
            throw new Error("Invalid response from server")
          }

          // Check if the upload was successful
          if (!responseData.success) {
            throw new Error(responseData.error || "Upload failed")
          }

          // Check the results for this specific file
          const fileResult = responseData.results?.find((r: any) => r.fileName === file.name)

          if (fileResult && fileResult.success) {
            // Update progress to 100% for success
            setUploadProgress((prev) =>
              prev.map((item) => (item.id === progressItem.id ? { ...item, progress: 100, status: "success" } : item)),
            )
            console.log(`File ${file.name} uploaded successfully`)
          } else {
            // Update progress to show error
            const errorMessage = fileResult?.error || "Upload failed"
            setUploadProgress((prev) =>
              prev.map((item) =>
                item.id === progressItem.id
                  ? {
                      ...item,
                      status: "error",
                      progress: 0,
                      error: errorMessage,
                    }
                  : item,
              ),
            )
            console.error(`File ${file.name} upload failed:`, errorMessage)
            throw new Error(errorMessage)
          }
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error)

          // Update progress to show error
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

      // Check if any files failed
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

      // Reload items after a short delay to allow server processing
      setTimeout(() => {
        loadItems()
        loadRecentFiles()
      }, 1000)
    } catch (error) {
      console.error("Error in upload process:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      // Keep the progress visible for a moment before clearing
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
      loadRecentFiles()
      loadCollections() // Refresh collections if we deleted a top-level folder
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete item",
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
      loadRecentFiles()
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

  // Determine which items to display based on the active tab
  const displayItems = activeTab === "recent" ? recentFiles : items

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 border-r bg-white">
        <div className="p-4">
          <h1 className="text-xl font-bold">MISSKEY Drive</h1>
        </div>
        <nav className="space-y-1 px-2">
          <NavItem
            href="#"
            icon={<LayoutGrid className="h-4 w-4" />}
            active={currentPath.length === 0 && activeTab !== "recent"}
            onClick={() => {
              setCurrentPath([])
              setActiveTab("folder")
            }}
          >
            All content
          </NavItem>
          <NavItem
            href="#"
            icon={<Clock className="h-4 w-4" />}
            active={activeTab === "recent"}
            onClick={() => {
              setActiveTab("recent")
              loadRecentFiles()
            }}
          >
            Recent Files
          </NavItem>
          <NavItem
            href="#"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6m-3 4v6m-3-3h6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            Shared with me
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
              <Input type="search" placeholder="Search files..." className="pl-9" />
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
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="h-8 w-8 overflow-hidden rounded-full">
              <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                {userId.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-auto">
          <div className="mb-6 flex items-center gap-4">
            <Button className="gap-2" onClick={() => setIsCreateFolderOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Folder
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <label>
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  disabled={isUploading}
                />
              </label>
            </Button>
            {currentPath.length > 0 && activeTab !== "recent" && (
              <Button variant="outline" className="gap-2" onClick={navigateUp}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          {/* Path breadcrumb */}
          {currentPath.length > 0 && activeTab !== "recent" && (
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

          {/* Tab navigation */}
          <div className="mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="folder">Folder</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="starred">Starred</TabsTrigger>
                <TabsTrigger value="shared">Shared</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

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
          {(isLoading && activeTab !== "recent") || (isLoadingRecent && activeTab === "recent") ? (
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
                {activeTab === "recent" ? "No recent files found" : "This folder is empty"}
              </div>
              {activeTab !== "recent" && <DragDropZone onUpload={handleFileUpload} isUploading={isUploading} />}
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
                  onDownload={item.type === "file" ? () => handleDownloadFile(item.id) : undefined}
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
                  onDownload={item.type === "file" ? () => handleDownloadFile(item.id) : undefined}
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

      {/* File Preview Dialog */}
      <FilePreview fileId={previewFileId} onClose={() => setPreviewFileId(null)} />
    </div>
  )
}
