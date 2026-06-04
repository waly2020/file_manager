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
  Tag,
  Rows,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import type { FileInfo } from "@/lib/fs"
import { formatFileSize, listFiles } from "@/lib/fs"
import { getCategoryForExtension } from "@/lib/categories"
import { organizeFilesByType, organizeFilesByExtension } from "@/lib/file-ops"
import { useAppStore } from "@/store/app-store"

type OrgMode = "by-type" | "by-extension"

interface FolderGroup {
  folderName: string
  files: FileInfo[]
  totalSize: number
}

export function FileOrganizer() {
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [files, setFiles] = useState<FileInfo[]>([])
  const [mode, setMode] = useState<OrgMode>("by-type")
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [results, setResults] = useState<{ success: number; errors: number } | null>(null)
  const { settings, addHistoryEntry } = useAppStore()

  const grouped = useMemo<FolderGroup[]>(() => {
    const map = new Map<string, FileInfo[]>()

    for (const file of files) {
      const key =
        mode === "by-extension"
          ? file.extension ? file.extension.toUpperCase() : "Sans extension"
          : getCategoryForExtension(file.extension, settings.categories)

      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(file)
    }

    return Array.from(map.entries())
      .map(([folderName, groupFiles]) => ({
        folderName,
        files: groupFiles,
        totalSize: groupFiles.reduce((acc, f) => acc + f.size, 0),
      }))
      .sort((a, b) => b.files.length - a.files.length)
  }, [files, mode, settings.categories])

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
      const result =
        mode === "by-extension"
          ? await organizeFilesByExtension(dirHandle, files, (done, total) =>
              setProgress({ done, total })
            )
          : await organizeFilesByType(dirHandle, files, settings.categories, (done, total) =>
              setProgress({ done, total })
            )

      addHistoryEntry({
        type: "organize",
        summary: `Organisation ${mode === "by-extension" ? "par extension" : "par type"} — "${dirHandle.name}"`,
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
      description="Classe automatiquement vos fichiers dans des sous-dossiers"
    >
      <div className="flex flex-col gap-6">
        <FolderPicker onSelect={handleFolderSelect} currentDirName={dirHandle?.name} />

        {/* Sélecteur de mode */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Mode d'organisation</p>
          <div className="flex gap-2">
            <button
              onClick={() => { setMode("by-type"); setResults(null) }}
              className={`flex flex-1 items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                mode === "by-type"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <Tag className={`mt-0.5 size-5 shrink-0 ${mode === "by-type" ? "text-primary" : "text-muted-foreground"}`} weight={mode === "by-type" ? "fill" : "regular"} />
              <div>
                <p className="text-sm font-medium">Par type de fichier</p>
                <p className="text-xs text-muted-foreground">
                  Regroupe les extensions similaires. <span className="font-mono">.jpg</span> et <span className="font-mono">.png</span> → <span className="font-mono">Images/</span>
                </p>
              </div>
            </button>

            <button
              onClick={() => { setMode("by-extension"); setResults(null) }}
              className={`flex flex-1 items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                mode === "by-extension"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <Rows className={`mt-0.5 size-5 shrink-0 ${mode === "by-extension" ? "text-primary" : "text-muted-foreground"}`} weight={mode === "by-extension" ? "fill" : "regular"} />
              <div>
                <p className="text-sm font-medium">Par extension</p>
                <p className="text-xs text-muted-foreground">
                  Un dossier par extension. <span className="font-mono">.jpg</span> → <span className="font-mono">JPG/</span> · <span className="font-mono">.png</span> → <span className="font-mono">PNG/</span>
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Résultats */}
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
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{files.length}</strong> fichier(s) →{" "}
                <strong className="text-foreground">{grouped.length}</strong> dossier(s)
              </p>
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
              {grouped.map(({ folderName, files: groupFiles, totalSize }) => (
                <Card key={folderName}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderSimple className="size-4 text-muted-foreground" weight="fill" />
                        <CardTitle className="font-mono text-sm">{folderName}/</CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {groupFiles.length} fichier{groupFiles.length > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatFileSize(totalSize)}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-28">
                      <div className="flex flex-col gap-1">
                        {groupFiles.map((f) => (
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
                Choisissez ensuite votre mode d'organisation.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
