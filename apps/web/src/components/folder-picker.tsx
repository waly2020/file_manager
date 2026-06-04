import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { FolderOpen, Warning, ArrowClockwise } from "@phosphor-icons/react"
import { pickDirectory, listFiles, isFileSystemAccessSupported } from "@/lib/fs"
import type { FileInfo } from "@/lib/fs"

interface FolderPickerProps {
  onSelect: (dir: FileSystemDirectoryHandle, files: FileInfo[]) => void
  currentDirName?: string | null
}

export function FolderPicker({ onSelect, currentDirName }: FolderPickerProps) {
  const [loading, setLoading] = useState(false)

  if (!isFileSystemAccessSupported()) {
    return (
      <Alert variant="destructive">
        <Warning className="size-4" />
        <AlertDescription>
          Votre navigateur ne supporte pas l'API File System Access. Utilisez Chrome, Edge ou Opera.
        </AlertDescription>
      </Alert>
    )
  }

  const handlePick = async () => {
    setLoading(true)
    try {
      const dir = await pickDirectory()
      if (!dir) return
      const files = await listFiles(dir)
      onSelect(dir, files)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {loading ? (
        <Skeleton className="h-9 w-48" />
      ) : (
        <Button variant="outline" onClick={handlePick} disabled={loading}>
          {currentDirName ? (
            <ArrowClockwise data-icon="inline-start" />
          ) : (
            <FolderOpen data-icon="inline-start" />
          )}
          {currentDirName ? "Changer de dossier" : "Sélectionner un dossier"}
        </Button>
      )}
      {currentDirName && (
        <Badge variant="secondary" className="gap-1 font-mono text-xs">
          <FolderOpen className="size-3" />
          {currentDirName}
        </Badge>
      )}
    </div>
  )
}
