"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { Upload } from "lucide-react"

interface DragDropZoneProps {
  onUpload: (files: FileList) => Promise<void>
  isUploading: boolean
  currentPath: string
  folderId?: string | null
}

export default function DragDropZone({ onUpload, isUploading, currentPath, folderId }: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const { toast } = useToast()

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const { files } = e.dataTransfer
      if (files && files.length > 0) {
        try {
          await onUpload(files)
        } catch (error) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to upload files",
            variant: "destructive",
          })
        }
      }
    },
    [onUpload, toast],
  )

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center">
        <Upload className={`h-10 w-10 mb-2 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
        <p className="text-sm font-medium mb-1">{isUploading ? "Uploading..." : "Drag and drop files here"}</p>
        <p className="text-xs text-gray-500">or click the Upload button above</p>
        <p className="text-xs text-gray-500 mt-2">Current path: {currentPath}</p>
      </div>
    </div>
  )
}
