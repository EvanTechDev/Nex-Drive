"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Folder, File, Upload, FolderPlus, ArrowLeft, Loader2, MoreHorizontal, Trash2 } from "lucide-react"
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
import FilePreview from "./file-preview"
import DragDropZone from "./drag-drop-zone"

interface FileItem {
  id: string
  name: string
  type: "file" | "folder"
  createdAt: string
  size?: number
  mimeType?: string
  thumbnailUrl?: string
}

interface FileManagerProps {
  userId: string
}

export default function FileManager({ userId }: FileManagerProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [items, setItems] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState<boolean>(false)
  const [newFolderName, setNewFolderName] = useState<string>("")
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const { toast } = useToast()
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const [previewFileId, setPreviewFileId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Get the current directory path string
  const getCurrentPathString = () => {
    return `drive/${userId}/data${currentPath.length > 0 ? "/" + currentPath.join("/") : ""}`
  }

  // Update the loadItems function
  const loadItems = async () => {
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
  }

  // Load items when component mounts or path changes
  useEffect(() => {
    loadItems()
  }, [userId, currentPath])

  // Navigate to a folder
  const navigateToFolder = (folderName: string) => {
    setCurrentPath([...currentPath, folderName])
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
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create folder",
        variant: "destructive",
      })
    }
  }

  // Update the handleFileUpload function to accept a FileList parameter
  const handleFileUpload = async (fileList: FileList) => {
    if (!fileList || fileList.length === 0) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("userId", userId)
      formData.append("path", getCurrentPathString())

      for (let i = 0; i < fileList.length; i++) {
        formData.append("files", fileList[i])
      }

      const response = await fetch("/api/upload-files", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to upload files")
      }

      toast({
        title: "Success",
        description: `${fileList.length} file(s) uploaded successfully`,
      })

      loadItems()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
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
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="w-full max-w-4xl bg-white rounded-lg shadow-md">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">MISSKEY Drive Manager</h1>
            <span className="text-sm text-gray-500">({userId})</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsCreateFolderOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button variant="outline" size="sm" asChild>
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
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={navigateUp} disabled={currentPath.length === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-sm text-gray-500">Current path: /{currentPath.join("/")}</div>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : loadError ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{loadError}</p>
            <Button onClick={loadItems}>Retry</Button>
          </div>
        ) : items.length === 0 ? (
          <div>
            <div className="text-center py-4 text-gray-500 mb-4">This folder is empty</div>
            <DragDropZone onUpload={handleFileUpload} isUploading={isUploading} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50">
                <div
                  className="flex items-center space-x-3 cursor-pointer flex-grow"
                  onClick={() => {
                    if (item.type === "folder") {
                      navigateToFolder(item.name)
                    } else {
                      setPreviewFileId(item.id)
                    }
                  }}
                >
                  {item.type === "folder" ? (
                    <Folder className="h-10 w-10 text-yellow-500" />
                  ) : item.thumbnailUrl ? (
                    <div className="h-10 w-10 overflow-hidden rounded">
                      <img
                        src={item.thumbnailUrl || "/placeholder.svg"}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <File className="h-10 w-10 text-blue-500" />
                  )}
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      {item.type === "file" && item.size
                        ? `${(item.size / 1024).toFixed(2)} KB`
                        : item.type === "folder"
                          ? "Folder"
                          : ""}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        setItemToDelete(item)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
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
