"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Upload, FileJson, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DropZoneProps {
  onFileUpload: (file: File) => void
}

export function DropZone({ onFileUpload }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [fileName, setFileName] = useState<string>("")

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files && files[0]) {
        processFile(files[0])
      }
    },
    [onFileUpload],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files[0]) {
        processFile(files[0])
      }
    },
    [onFileUpload],
  )

  const processFile = (file: File) => {
    setFileName(file.name)

    // Validate file type
    if (file.type === "application/json" || file.name.endsWith(".json") || file.name.endsWith(".spdx")) {
      setUploadStatus("success")
      onFileUpload(file)

      // Reset after 3 seconds
      setTimeout(() => {
        setUploadStatus("idle")
        setFileName("")
      }, 3000)
    } else {
      setUploadStatus("error")
      setTimeout(() => {
        setUploadStatus("idle")
        setFileName("")
      }, 3000)
    }
  }

  return (
    <Card className="rounded-3xl border-2 border-dashed border-border/50 bg-card/30 backdrop-blur-sm transition-all hover:border-primary/50">
      <CardContent className="p-12">
        <div
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 transition-all",
            isDragging ? "border-primary bg-primary/5 scale-105" : "border-border/30",
            uploadStatus === "success" && "border-green-500 bg-green-500/5",
            uploadStatus === "error" && "border-destructive bg-destructive/5",
          )}
        >
          {uploadStatus === "idle" && (
            <>
              <div
                className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-3xl transition-all",
                  isDragging ? "bg-primary/20 text-primary scale-110" : "bg-muted text-muted-foreground",
                )}
              >
                {isDragging ? <FileJson className="h-10 w-10" /> : <Upload className="h-10 w-10" />}
              </div>

              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground mb-2">Drop SBOM File Here</h3>
                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                <p className="text-xs text-muted-foreground">Supports JSON, SPDX formats</p>
              </div>

              <input
                type="file"
                accept=".json,.spdx"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </>
          )}

          {uploadStatus === "success" && (
            <>
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-green-500/20 text-green-600">
                <CheckCircle className="h-10 w-10" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground mb-2">Scan Successful</h3>
                <p className="text-sm text-muted-foreground">{fileName}</p>
              </div>
            </>
          )}

          {uploadStatus === "error" && (
            <>
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/20 text-destructive">
                <AlertCircle className="h-10 w-10" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground mb-2">Invalid File Format</h3>
                <p className="text-sm text-muted-foreground">Please upload a JSON or SPDX file</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
