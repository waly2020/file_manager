import { useState, useMemo } from "react"
import { Layout } from "@/components/layout"
import { FolderPicker } from "@/components/folder-picker"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Progress } from "@workspace/ui/components/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  Play,
  Info,
  FolderSimpleStar,
  CheckCircle,
  XCircle,
  FolderSimple,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import type { FileInfo } from "@/lib/fs"
import { formatFileSize, listFiles } from "@/lib/fs"
import { getCategoryForExtension } from "@/lib/categories"
import { organizeFilesByType } from "@/lib/file-ops"
import { useAppStore } from "@/store/app-store"

interface GroupedFiles {
  category: string
  files: FileInfo[]
  totalSize: number
}

export function FileOrganizer() {
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [files, setFiles] = useState<FileInfo[]>([])
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [results, setResults] = useState<{ success: number; errors: number } | null>(null)
  const { settings, addHistoryEntry } = useAppStore()

  const grouped = useMemo<GroupedFiles[]>(() => {
    const map = new Map<string, FileInfo[]>()
    for (const file of files) {
      const cat = getCategoryForExtension(file.extension, settings.categories)
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(file)
    }
    return Array.from(map.entries())
      .map(([category, catFiles]) => ({
        category,
        files: catFiles,
        totalSize: catFiles.reduce((acc, f) => acc + f.size, 0),
      }))
      .sort((a, b) => b.files.length - a.files.length)
  }, [files, settings.categories])

  const handleFolderSelect = (dir: FileSystemDirectoryHandle, fileList: FileInfo[]) => {
    setDirHandle(dir)
    setFiles(fileList)
    setProgress(null)
    setResults(null)
  }

  const execute = async () => {
    if (!dirHandle || files.length === 0) return
    setProgress({ done: 0, total: files.length })
    setResults(null)

    try {
      const result = await organizeFilesByType(
        dirHandle,
        files,
        settings.categories,
        (done, total) => setProgress({ done, total })
      )

      addHistoryEntry({
        type: "organize",
        summary: `Organisation de "${dirHandle.name}" en ${grouped.length} catégorie(s)`,
        folderName: dirHandle.name,
        successCount: result.success.length,
        errorCount: result.errors.length,
      })

      setResults({ success: result.success.length, errors: result.errors.length })

      if (result.errors.length === 0) {
        toast.success(`${result.success.length} fichier(s) organisé(s) avec succès`)
      } else {
        toast.warning(`${result.success.length} succès · ${result.errors.length} erreur(s)`)
      }

      const updatedFiles = await listFiles(dirHandle)
      setFiles(updatedFiles)
    } catch (e) {
      toast.error("Erreur : " + String(e))
    } finally {
      setProgress(null)
    }
  }

  const progressPercent = progress ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <Layout
      title="Organisateur de fichiers"
      description="Classe automatiquement vos fichiers par type dans des sous-dossiers"
    >
      <div className="flex flex-col gap-6">
        <FolderPicker onSelect={handleFolderSelect} currentDirName={dirHandle?.name} />

        {results && (
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="size-3 text-green-500" weight="fill" />
              {results.success} fichier(s) déplacé(s)
            </Badge>
            {results.errors > 0 && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="size-3" weight="fill" />
                {results.errors} erreur(s)
              </Badge>
            )}
          </div>
        )}

        {dirHandle && files.length === 0 && (
          <Alert>
            <Info className="size-4" />
            <AlertDescription>Le dossier est vide ou déjà organisé.</AlertDescription>
          </Alert>
        )}

        {grouped.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{files.length}</strong> fichier(s) →{" "}
                  <strong className="text-foreground">{grouped.length}</strong> catégorie(s)
                </p>
              </div>
              <Button onClick={execute} disabled={files.length === 0 || !!progress}>
                <Play data-icon="inline-start" />
                Organiser les fichiers
              </Button>
            </div>

            {progress && (
              <div className="flex flex-col gap-1">
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  {progress.done} / {progress.total} fichiers déplacés
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grouped.map(({ category, files: catFiles, totalSize }) => (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderSimple className="size-4 text-muted-foreground" weight="fill" />
                        <CardTitle className="text-sm">{category}/</CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {catFiles.length} fichier{catFiles.length > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatFileSize(totalSize)}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-28">
                      <div className="flex flex-col gap-1">
                        {catFiles.map((f) => (
                          <div key={f.name} className="flex items-center justify-between gap-2">
                            <span className="truncate font-mono text-xs text-muted-foreground">
                              {f.name}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground/60">
                              {formatFileSize(f.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!dirHandle && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <FolderSimpleStar className="size-10 text-muted-foreground/50" weight="thin" />
              <p className="text-sm font-medium">Sélectionnez un dossier</p>
              <p className="text-xs text-muted-foreground">
                L'organisateur analysera les fichiers et les regroupera par type.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
