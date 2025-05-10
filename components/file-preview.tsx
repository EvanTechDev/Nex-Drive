"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Download, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FilePreviewProps {
  fileId: string | null
  onClose: () => void
}

interface FileDetails {
  id: string
  name: string
  type: string
  size: number
  url: string
  thumbnailUrl?: string
  comment?: string
  createdAt: string
}

export default function FilePreview({ fileId, onClose }: FilePreviewProps) {
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!fileId) return

    const fetchFileDetails = async () => {
      setIsLoading(true)
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
          throw new Error(data.error || "Failed to get file preview")
        }

        const data = await response.json()
        setFileDetails(data.file)
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to get file preview",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchFileDetails()
  }, [fileId, toast])

  const handleDownload = () => {
    if (!fileDetails || !fileDetails.url) return

    // Create a temporary anchor element to trigger the download
    const link = document.createElement("a")
    link.href = fileDetails.url
    link.download = fileDetails.name
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Download started",
      description: `Downloading ${fileDetails.name}`,
    })
  }

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )
    }

    if (!fileDetails) {
      return <div className="text-center py-8 text-gray-500">File not found</div>
    }

    // Image preview
    if (fileDetails.type.startsWith("image/")) {
      return (
        <div className="flex flex-col items-center">
          <div className="max-h-[60vh] overflow-auto">
            <img
              src={fileDetails.url || "/placeholder.svg"}
              alt={fileDetails.name}
              className="max-w-full h-auto object-contain"
            />
          </div>
        </div>
      )
    }

    // Video preview
    if (fileDetails.type.startsWith("video/")) {
      return (
        <div className="flex flex-col items-center">
          <video controls className="max-w-full max-h-[60vh]">
            <source src={fileDetails.url} type={fileDetails.type} />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    // Audio preview
    if (fileDetails.type.startsWith("audio/")) {
      return (
        <div className="flex flex-col items-center">
          <audio controls className="w-full">
            <source src={fileDetails.url} type={fileDetails.type} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      )
    }

    // PDF preview
    if (fileDetails.type === "application/pdf") {
      return (
        <div className="flex flex-col items-center">
          <iframe src={`${fileDetails.url}#toolbar=0`} className="w-full h-[60vh]" title={fileDetails.name}></iframe>
        </div>
      )
    }

    // Text preview
    if (
      fileDetails.type.startsWith("text/") ||
      fileDetails.type === "application/json" ||
      fileDetails.type === "application/xml"
    ) {
      return (
        <div className="flex flex-col items-center">
          <div className="bg-gray-100 p-4 rounded-md w-full max-h-[60vh] overflow-auto">
            <p className="text-sm font-mono whitespace-pre-wrap">
              Text preview not available. Please download the file to view its contents.
            </p>
          </div>
        </div>
      )
    }

    // Default: No preview available
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Preview not available for this file type</p>
          {fileDetails.thumbnailUrl && (
            <img
              src={fileDetails.thumbnailUrl || "/placeholder.svg"}
              alt={fileDetails.name}
              className="max-w-[200px] max-h-[200px] mx-auto mb-4"
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={!!fileId} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="truncate max-w-[500px]">{fileDetails?.name || "File Preview"}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="flex-1 overflow-auto py-4">{renderPreview()}</div>
        {fileDetails && (
          <div className="border-t pt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {fileDetails.type} • {(fileDetails.size / 1024).toFixed(2)} KB
            </div>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
