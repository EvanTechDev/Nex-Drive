"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Calendar, HardDrive, FileType, FolderIcon, FileIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ItemDetailsProps {
  itemId: string | null
  itemType: "file" | "folder" | null
  onClose: () => void
}

interface ItemDetails {
  id: string
  name: string
  type: "file" | "folder"
  createdAt: string
  updatedAt?: string
  size?: number
  mimeType?: string
  thumbnailUrl?: string
  url?: string
  properties?: Record<string, any>
  folderId?: string
  isSensitive?: boolean
  blurhash?: string
  comment?: string
  parentId?: string
  foldersCount?: number
  filesCount?: number
  description?: string
}

export default function ItemDetailsDialog({ itemId, itemType, onClose }: ItemDetailsProps) {
  const [details, setDetails] = useState<ItemDetails | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!itemId || !itemType) return

    const fetchDetails = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/item-details", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ itemId, itemType }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to get item details")
        }

        const data = await response.json()
        setDetails(data.details)
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to get item details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetails()
  }, [itemId, itemType, toast])

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown"
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const formatSize = (size?: number) => {
    if (!size) return "Unknown"
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  return (
    <Dialog open={!!itemId} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate max-w-[400px]">
            {details?.name || (itemType === "file" ? "File Details" : "Folder Details")}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto py-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : details ? (
            <div className="space-y-6">
              {details.type === "file" && details.thumbnailUrl && (
                <div className="flex justify-center">
                  <div className="max-w-[300px] max-h-[200px] overflow-hidden rounded-md">
                    <img
                      src={details.thumbnailUrl || "/placeholder.svg"}
                      alt={details.name}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  {details.type === "file" ? (
                    <FileIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                  ) : (
                    <FolderIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type</p>
                    <p className="text-sm">
                      {details.type === "file"
                        ? details.mimeType || "File"
                        : `Folder (${details.filesCount || 0} files, ${details.foldersCount || 0} folders)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created</p>
                    <p className="text-sm">{formatDate(details.createdAt)}</p>
                  </div>
                </div>

                {details.type === "file" && (
                  <>
                    <div className="flex items-start gap-2">
                      <HardDrive className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Size</p>
                        <p className="text-sm">{formatSize(details.size)}</p>
                      </div>
                    </div>

                    {details.updatedAt && (
                      <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Last Modified</p>
                          <p className="text-sm">{formatDate(details.updatedAt)}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <FileType className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">File Extension</p>
                        <p className="text-sm">
                          {details.name.includes(".") ? details.name.split(".").pop()?.toUpperCase() || "None" : "None"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {details.type === "file" && details.comment && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">Comment</p>
                  <p className="text-sm mt-1 p-2 bg-gray-50 rounded-md">{details.comment}</p>
                </div>
              )}

              {details.type === "folder" && details.description && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-sm mt-1 p-2 bg-gray-50 rounded-md">{details.description}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">Item details not found</div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
