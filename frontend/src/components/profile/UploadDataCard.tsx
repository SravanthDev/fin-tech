import { useMutation, useQueryClient } from "@tanstack/react-query"
import { UploadCloud } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { apiRequest, ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { User } from "@/types"

export function UploadDataCard({ user }: { user: User }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      return apiRequest<{ filename: string; transactionCount: number }>("/api/upload", {
        method: "POST",
        body: formData,
        isForm: true,
      })
    },
    onSuccess: (res) => {
      toast.success(`Replaced dataset with ${res.transactionCount} transactions from ${res.filename}.`)
      queryClient.invalidateQueries()
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Upload failed. Please check the file format.")
    },
  })

  function handleFile(file: File | undefined | null) {
    if (!file) return
    uploadMutation.mutate(file)
  }

  return (
    <div className="card-surface p-6">
      <h3 className="text-base font-semibold text-foreground">Data</h3>
      <p className="mb-4 text-sm text-muted-foreground">Upload or replace your financial dataset</p>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
          dragOver ? "border-primary bg-primary-soft" : "border-border hover:bg-muted",
        )}
      >
        <UploadCloud className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          {uploadMutation.isPending ? "Uploading…" : "Upload Financial Data"}
        </p>
        <p className="text-xs text-muted-foreground">Drag and drop, or click to browse (.xlsx, .xls, .csv)</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-muted px-4 py-3">
          <p className="text-xs text-muted-foreground">Data source</p>
          <p className="mt-0.5 truncate text-sm font-medium text-foreground">
            {user.lastUploadFilename ?? "No file uploaded yet"}
          </p>
        </div>
        <div className="rounded-lg bg-muted px-4 py-3">
          <p className="text-xs text-muted-foreground">Last uploaded</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {user.lastUploadAt ? new Date(user.lastUploadAt).toLocaleString("en-IN") : "—"}
          </p>
        </div>
      </div>
    </div>
  )
}
