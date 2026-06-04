import { useState, useMemo } from "react"
import { Layout } from "@/components/layout"
import { FolderPicker } from "@/components/folder-picker"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Progress } from "@workspace/ui/components/progress"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Separator } from "@workspace/ui/components/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import {
  Play,
  ArrowRight,
  Files,
  CheckCircle,
  XCircle,
  Info,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import type { FileInfo } from "@/lib/fs"
import { listFiles } from "@/lib/fs"
import { applyRenameRule, batchRenameFiles } from "@/lib/file-ops"
import type { RenameRule } from "@/lib/file-ops"
import { useAppStore } from "@/store/app-store"

type TabKey = "prefix" | "suffix" | "number" | "find-replace" | "case"

export function BatchRename() {
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [files, setFiles] = useState<FileInfo[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>("prefix")
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [results, setResults] = useState<{ success: number; errors: number } | null>(null)
  const addHistoryEntry = useAppStore((s) => s.addHistoryEntry)

  // Rule state per tab
  const [prefix, setPrefix] = useState("")
  const [suffix, setSuffix] = useState("")
  const [findText, setFindText] = useState("")
  const [replaceText, setReplaceText] = useState("")
  const [caseType, setCaseType] = useState<"upper" | "lower" | "title" | "sentence">("title")
  const [numStart, setNumStart] = useState(1)
  const [numPadding, setNumPadding] = useState(3)
  const [numPosition, setNumPosition] = useState<"prefix" | "suffix">("prefix")
  const [numSeparator, setNumSeparator] = useState("_")

  const currentRule = useMemo<RenameRule>(() => {
    switch (activeTab) {
      case "prefix": return { type: "prefix", prefix }
      case "suffix": return { type: "suffix", suffix }
      case "find-replace": return { type: "find-replace", find: findText, replace: replaceText }
      case "case": return { type: "case", caseType }
      case "number": return { type: "number", numberStart: numStart, numberPadding: numPadding, numberPosition: numPosition, numberSeparator: numSeparator }
    }
  }, [activeTab, prefix, suffix, findText, replaceText, caseType, numStart, numPadding, numPosition, numSeparator])

  const preview = useMemo(
    () => files.map((f, i) => ({ original: f.name, renamed: applyRenameRule(f.name, currentRule, i) })),
    [files, currentRule]
  )

  const changesCount = preview.filter((p) => p.original !== p.renamed).length

  const handleFolderSelect = (dir: FileSystemDirectoryHandle, fileList: FileInfo[]) => {
    setDirHandle(dir)
    setFiles(fileList)
    setProgress(null)
    setResults(null)
  }

  const execute = async () => {
    if (!dirHandle || files.length === 0 || changesCount === 0) return
    const filesToProcess = files.filter((_, i) => preview[i].original !== preview[i].renamed)
    setProgress({ done: 0, total: filesToProcess.length })
    setResults(null)

    try {
      const result = await batchRenameFiles(
        dirHandle,
        filesToProcess,
        currentRule,
        (done, total) => setProgress({ done, total })
      )

      addHistoryEntry({
        type: "batch-rename",
        summary: `Renommage groupé (${activeTab}) — ${filesToProcess.length} fichier(s)`,
        folderName: dirHandle.name,
        successCount: result.success.length,
        errorCount: result.errors.length,
      })

      setResults({ success: result.success.length, errors: result.errors.length })

      if (result.errors.length === 0) {
        toast.success(`${result.success.length} fichier(s) renommé(s) avec succès`)
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
      title="Renommage groupé"
      description="Renommez des fichiers en masse avec des règles personnalisées"
    >
      <div className="flex flex-col gap-6">
        <FolderPicker onSelect={handleFolderSelect} currentDirName={dirHandle?.name} />

        {results && (
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="size-3 text-green-500" weight="fill" />
              {results.success} renommé(s)
            </Badge>
            {results.errors > 0 && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="size-3" weight="fill" />
                {results.errors} erreur(s)
              </Badge>
            )}
          </div>
        )}

        {!dirHandle && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <Files className="size-10 text-muted-foreground/50" weight="thin" />
              <p className="text-sm font-medium">Sélectionnez un dossier pour commencer</p>
            </CardContent>
          </Card>
        )}

        {dirHandle && files.length === 0 && (
          <Alert>
            <Info className="size-4" />
            <AlertDescription>Le dossier est vide.</AlertDescription>
          </Alert>
        )}

        {files.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Règles */}
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold">Règle de renommage</h2>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="prefix" className="text-xs">Préfixe</TabsTrigger>
                  <TabsTrigger value="suffix" className="text-xs">Suffixe</TabsTrigger>
                  <TabsTrigger value="number" className="text-xs">N°</TabsTrigger>
                  <TabsTrigger value="find-replace" className="text-xs">Rempl.</TabsTrigger>
                  <TabsTrigger value="case" className="text-xs">Casse</TabsTrigger>
                </TabsList>

                <TabsContent value="prefix" className="mt-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Texte à ajouter avant</label>
                    <Input
                      placeholder="ex: 2024_"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Résultat : <span className="font-mono">{prefix}nom_fichier.ext</span>
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="suffix" className="mt-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Texte à ajouter après</label>
                    <Input
                      placeholder="ex: _final"
                      value={suffix}
                      onChange={(e) => setSuffix(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Résultat : <span className="font-mono">nom_fichier{suffix}.ext</span>
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="number" className="mt-4">
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Début</label>
                        <Input
                          type="number"
                          min={0}
                          value={numStart}
                          onChange={(e) => setNumStart(Number(e.target.value))}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Zéros (largeur)</label>
                        <Input
                          type="number"
                          min={1}
                          max={6}
                          value={numPadding}
                          onChange={(e) => setNumPadding(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Position</label>
                        <Select value={numPosition} onValueChange={(v) => setNumPosition(v as "prefix" | "suffix")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="prefix">Avant le nom</SelectItem>
                            <SelectItem value="suffix">Après le nom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Séparateur</label>
                        <Input
                          value={numSeparator}
                          onChange={(e) => setNumSeparator(e.target.value)}
                          maxLength={3}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="find-replace" className="mt-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">Rechercher</label>
                      <Input placeholder="texte à trouver" value={findText} onChange={(e) => setFindText(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">Remplacer par</label>
                      <Input placeholder="remplacement (vide = supprimer)" value={replaceText} onChange={(e) => setReplaceText(e.target.value)} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="case" className="mt-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Type de casse</label>
                    <Select value={caseType} onValueChange={(v) => setCaseType(v as typeof caseType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upper">MAJUSCULES</SelectItem>
                        <SelectItem value="lower">minuscules</SelectItem>
                        <SelectItem value="title">Première Lettre En Majuscule</SelectItem>
                        <SelectItem value="sentence">Première lettre en majuscule</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-between gap-4 pt-2">
                <Badge variant="secondary" className="text-xs">
                  {changesCount} / {files.length} fichier(s) modifié(s)
                </Badge>
                <Button onClick={execute} disabled={changesCount === 0 || !!progress}>
                  <Play data-icon="inline-start" />
                  Appliquer
                </Button>
              </div>

              {progress && (
                <div className="flex flex-col gap-1">
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">
                    {progress.done} / {progress.total}
                  </p>
                </div>
              )}
            </div>

            {/* Prévisualisation */}
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold">Prévisualisation</h2>
              <Card>
                <div className="grid grid-cols-[1fr_28px_1fr] gap-2 border-b px-4 py-2">
                  <span className="text-xs font-medium text-muted-foreground">Original</span>
                  <span />
                  <span className="text-xs font-medium text-muted-foreground">Nouveau nom</span>
                </div>
                <ScrollArea className="h-[360px]">
                  {preview.map(({ original, renamed }, i) => (
                    <div key={i}>
                      {i > 0 && <Separator />}
                      <div className="grid grid-cols-[1fr_28px_1fr] items-center gap-2 px-4 py-2">
                        <span className="truncate font-mono text-xs text-muted-foreground">{original}</span>
                        <ArrowRight className={original !== renamed ? "text-primary" : "text-muted-foreground/30"} />
                        <span
                          className={`truncate font-mono text-xs ${original !== renamed ? "text-primary font-medium" : "text-muted-foreground/50"}`}
                        >
                          {renamed}
                        </span>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
