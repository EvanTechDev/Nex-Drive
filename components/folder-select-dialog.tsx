"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, FolderIcon, ChevronRight, Home } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FolderSelectDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (folderId: string, folderPath: string) => void
  userId: string
  currentFolderId?: string | null
}

interface FolderItem {
  id: string
  name: string
  parentId?: string
}

export default function FolderSelectDialog({
  isOpen,
  onClose,
  onSelect,
  userId,
  currentFolderId,
}: FolderSelectDialogProps) {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [pathIds, setPathIds] = useState<string[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const { toast } = useToast()

  // 加载文件夹
  const loadFolders = async (parentId?: string) => {
    setIsLoading(true)
    try {
      // 构建API请求路径
      let path = "drive"
      if (userId) {
        path += `/${userId}`
      }
      if (currentPath.length > 0) {
        path += `/${currentPath.join("/")}`
      }

      const response = await fetch("/api/list-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          path,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load folders")
      }

      const data = await response.json()

      // 只保留文件夹
      const folderItems = data.items.filter((item: any) => item.type === "folder")

      // 如果有当前文件夹ID，从列表中排除它（不能移动到自己）
      const filteredFolders = currentFolderId
        ? folderItems.filter((folder: any) => folder.id !== currentFolderId)
        : folderItems

      setFolders(filteredFolders)

      // 如果有folderId，保存它
      if (data.folderId) {
        setPathIds((prev) => {
          const newPathIds = [...prev]
          newPathIds[currentPath.length] = data.folderId
          return newPathIds
        })
      }
    } catch (error) {
      console.error("Error loading folders:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load folders",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 当对话框打开或路径改变时加载文件夹
  useEffect(() => {
    if (isOpen) {
      loadFolders()
    }
  }, [isOpen, currentPath, userId])

  // 导航到文件夹
  const navigateToFolder = (folderName: string) => {
    setCurrentPath([...currentPath, folderName])
  }

  // 导航到特定路径
  const navigateToPath = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1))
  }

  // 导航到根目录
  const navigateToRoot = () => {
    setCurrentPath([])
  }

  // 选择当前文件夹
  const handleSelectFolder = () => {
    // 如果在根目录，使用根目录ID
    const folderId = currentPath.length === 0 ? pathIds[0] : pathIds[currentPath.length]
    if (!folderId) {
      toast({
        title: "Error",
        description: "Could not determine folder ID",
        variant: "destructive",
      })
      return
    }

    // 构建完整路径字符串
    const folderPath = currentPath.length === 0 ? "Root" : currentPath.join("/")
    onSelect(folderId, folderPath)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Destination Folder</DialogTitle>
        </DialogHeader>

        {/* 路径导航 */}
        <div className="flex items-center space-x-1 text-sm py-2 border-b">
          <Button variant="ghost" size="sm" className="h-7" onClick={navigateToRoot}>
            <Home className="h-4 w-4 mr-1" />
            Root
          </Button>

          {currentPath.map((folder, index) => (
            <div key={index} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <Button variant="ghost" size="sm" className="h-7" onClick={() => navigateToPath(index)}>
                {folder}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto py-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No folders found</div>
          ) : (
            <div className="space-y-1">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                  onClick={() => navigateToFolder(folder.name)}
                >
                  <FolderIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <span>{folder.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSelectFolder} disabled={isLoading}>
            Select This Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
