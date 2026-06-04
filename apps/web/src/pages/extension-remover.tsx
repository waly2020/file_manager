import { useState, useMemo, useCallback } from "react"
import { Layout } from "@/components/layout"
import { FolderPicker } from "@/components/folder-picker"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Progress } from "@workspace/ui/components/progress"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Separator } from "@workspace/ui/components/separator"
import { Card } from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  ArrowRight,
  CheckSquare,
  Square,
  Info,
  TextTSlash,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import type { FileInfo } from "@/lib/fs"
import { formatFileSize, listFiles } from "@/lib/fs"
import { hasExtension, getRemovableExtensions, computeNewName } from "@/lib/categories"
import { removeExtensionsFromFiles } from "@/lib/file-ops"
import { useAppStore } from "@/store/app-store"

export function ExtensionRemover() {
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [files, setFiles] = useState<FileInfo[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  // Map<filename, chosenSuffix> — par défaut : dernière extension seulement
  const [suffixChoices, setSuffixChoices] = useState<Map<string, string>>(new Map())
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [results, setResults] = useState<{ success: number; errors: number } | null>(null)
  const addHistoryEntry = useAppStore((s) => s.addHistoryEntry)

  const eligibleFiles = useMemo(() => files.filter((f) => hasExtension(f.name)), [files])
  const allSelected = eligibleFiles.length > 0 && selected.size === eligibleFiles.length

  const getChoice = useCallback(
    (filename: string) => {
      const options = getRemovableExtensions(filename)
      return suffixChoices.get(filename) ?? options[0]?.suffix ?? ""
    },
    [suffixChoices]
  )

  const getPreviewName = useCallback(
    (filename: string) => computeNewName(filename, getChoice(filename)),
    [getChoice]
  )

  const handleFolderSelect = (dir: FileSystemDirectoryHandle, fileList: FileInfo[]) => {
    setDirHandle(dir)
    setFiles(fileList)
    setSelected(new Set())
    setSuffixChoices(new Map())
    setProgress(null)
    setResults(null)
  }

  const toggleSelectAll = () => {
    setSelected(allSelected ? new Set() : new Set(eligibleFiles.map((f) => f.name)))
  }

  const toggleFile = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const setChoice = (filename: string, suffix: string) => {
    setSuffixChoices((prev) => new Map(prev).set(filename, suffix))
  }

  const execute = async () => {
    if (!dirHandle || selected.size === 0) return
    const filesToProcess = eligibleFiles.filter((f) => selected.has(f.name))
    setProgress({ done: 0, total: filesToProcess.length })
    setResults(null)

    try {
      const result = await removeExtensionsFromFiles(
        dirHandle,
        filesToProcess,
        suffixChoices,
        (done, total) => setProgress({ done, total })
      )

      addHistoryEntry({
        type: "extension-remove",
        summary: `Suppression d'extensions — ${filesToProcess.length} fichier(s)`,
        folderName: dirHandle.name,
        successCount: result.success.length,
        errorCount: result.errors.length,
      })

      setResults({ success: result.success.length, errors: result.errors.length })

      if (result.errors.length === 0) {
        toast.success(`${result.success.length} fichier(s) traité(s) avec succès`)
      } else {
        toast.warning(`${result.success.length} succès · ${result.errors.length} erreur(s)`)
      }

      const updatedFiles = await listFiles(dirHandle)
      setFiles(updatedFiles)
      setSelected(new Set())
      setSuffixChoices(new Map())
    } catch (e) {
      toast.error("Erreur : " + String(e))
    } finally {
      setProgress(null)
    }
  }

  const progressPercent = progress ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <Layout
      title="Suppresseur d'extensions"
      description="Choisissez précisément quelle extension retirer pour chaque fichier"
    >
      <div className="flex flex-col gap-6">
        <FolderPicker onSelect={handleFolderSelect} currentDirName={dirHandle?.name} />

        {results && (
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="size-3 text-green-500" weight="fill" />
              {results.success} traité(s)
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
            <AlertDescription>Le dossier est vide.</AlertDescription>
          </Alert>
        )}

        {dirHandle && files.length > 0 && eligibleFiles.length === 0 && (
          <Alert>
            <Info className="size-4" />
            <AlertDescription>
              Aucun fichier avec extension dans ce dossier.
            </AlertDescription>
          </Alert>
        )}

        {eligibleFiles.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={toggleSelectAll} disabled={!!progress}>
                  {allSelected ? (
                    <CheckSquare data-icon="inline-start" />
                  ) : (
                    <Square data-icon="inline-start" />
                  )}
                  {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
                </Button>
                <Badge variant="secondary" className="text-xs">
                  {selected.size} / {eligibleFiles.length}
                </Badge>
              </div>
              <Button onClick={execute} disabled={selected.size === 0 || !!progress}>
                <TextTSlash data-icon="inline-start" />
                Supprimer les extensions
              </Button>
            </div>

            {progress && (
              <div className="flex flex-col gap-1">
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  {progress.done} / {progress.total} fichiers
                </p>
              </div>
            )}

            <Card>
              {/* En-têtes */}
              <div className="grid grid-cols-[auto_1fr_auto_1fr_80px] items-center gap-3 border-b px-4 py-2">
                <span className="w-4" />
                <span className="text-xs font-medium text-muted-foreground">Nom original</span>
                <span className="w-4" />
                <span className="text-xs font-medium text-muted-foreground">Nouveau nom</span>
                <span className="text-xs font-medium text-muted-foreground text-right">Taille</span>
              </div>

              <ScrollArea className="h-105">
                {eligibleFiles.map((file, i) => {
                  const options = getRemovableExtensions(file.name)
                  const isMulti = options.length > 1
                  const chosenSuffix = getChoice(file.name)
                  const newName = getPreviewName(file.name)
                  const isSelected = selected.has(file.name)

                  return (
                    <div key={file.name}>
                      {i > 0 && <Separator />}
                      <div
                        className="grid grid-cols-[auto_1fr_auto_1fr_80px] cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-muted/40"
                        onClick={() => toggleFile(file.name)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleFile(file.name)}
                          onClick={(e) => e.stopPropagation()}
                        />

                        {/* Nom original */}
                        <span className="truncate font-mono text-sm">{file.name}</span>

                        <ArrowRight className="shrink-0 text-muted-foreground" />

                        {/* Nouveau nom + sélecteur si multi-extensions */}
                        <div className="flex min-w-0 flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                          {isMulti ? (
                            <>
                              <Select
                                value={chosenSuffix}
                                onValueChange={(v) => setChoice(file.name, v)}
                              >
                                <SelectTrigger className="h-7 w-full text-xs font-mono">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {options.map((opt) => (
                                    <SelectItem
                                      key={opt.suffix}
                                      value={opt.suffix}
                                      className="font-mono text-xs"
                                    >
                                      {opt.label} → <span className="text-primary">{opt.result}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="truncate font-mono text-xs text-primary">
                                {newName}
                              </span>
                            </>
                          ) : (
                            <span className="truncate font-mono text-sm text-primary">
                              {newName}
                            </span>
                          )}
                        </div>

                        <span className="text-right text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </ScrollArea>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}
