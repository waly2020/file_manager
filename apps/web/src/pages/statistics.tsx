import { useState, useMemo } from "react"
import { Layout } from "@/components/layout"
import { FolderPicker } from "@/components/folder-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Separator } from "@workspace/ui/components/separator"
import { ChartPie, File, HardDrive, Stack, ArrowUp } from "@phosphor-icons/react"
import type { FileInfo } from "@/lib/fs"
import { formatFileSize } from "@/lib/fs"
import { getCategoryForExtension } from "@/lib/categories"
import { useAppStore } from "@/store/app-store"

interface CategoryStat {
  category: string
  count: number
  size: number
  percent: number
  color: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Images: "bg-blue-500",
  Vidéos: "bg-purple-500",
  Audio: "bg-green-500",
  Documents: "bg-orange-500",
  Archives: "bg-yellow-500",
  Code: "bg-red-500",
  Polices: "bg-pink-500",
  Exécutables: "bg-gray-500",
  Autres: "bg-slate-400",
}

export function Statistics() {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const { settings } = useAppStore()

  const stats = useMemo<CategoryStat[]>(() => {
    const map = new Map<string, { count: number; size: number }>()
    for (const file of files) {
      const cat = getCategoryForExtension(file.extension, settings.categories)
      const prev = map.get(cat) ?? { count: 0, size: 0 }
      map.set(cat, { count: prev.count + 1, size: prev.size + file.size })
    }
    const total = files.length || 1
    return Array.from(map.entries())
      .map(([category, { count, size }]) => ({
        category,
        count,
        size,
        percent: Math.round((count / total) * 100),
        color: CATEGORY_COLORS[category] ?? "bg-slate-400",
      }))
      .sort((a, b) => b.count - a.count)
  }, [files, settings.categories])

  const totalSize = useMemo(() => files.reduce((acc, f) => acc + f.size, 0), [files])
  const avgSize = files.length > 0 ? totalSize / files.length : 0

  const largestFiles = useMemo(
    () => [...files].sort((a, b) => b.size - a.size).slice(0, 10),
    [files]
  )

  const handleFolderSelect = (dir: FileSystemDirectoryHandle, fileList: FileInfo[]) => {
    setDirHandle(dir)
    setFiles(fileList)
  }

  return (
    <Layout
      title="Statistiques"
      description="Analysez le contenu et la répartition de vos fichiers"
    >
      <div className="flex flex-col gap-6">
        <FolderPicker onSelect={handleFolderSelect} currentDirName={dirHandle?.name} />

        {!dirHandle && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <ChartPie className="size-10 text-muted-foreground/50" weight="thin" />
              <p className="text-sm font-medium">Sélectionnez un dossier pour voir les statistiques</p>
            </CardContent>
          </Card>
        )}

        {dirHandle && (
          <div className="flex flex-col gap-6">
            {/* Résumé */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <Stack className="size-4 text-primary" weight="fill" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{files.length}</p>
                    <p className="text-xs text-muted-foreground">Fichiers totaux</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <HardDrive className="size-4 text-primary" weight="fill" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatFileSize(totalSize)}</p>
                    <p className="text-xs text-muted-foreground">Taille totale</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <File className="size-4 text-primary" weight="fill" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatFileSize(avgSize)}</p>
                    <p className="text-xs text-muted-foreground">Taille moyenne</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <ChartPie className="size-4 text-primary" weight="fill" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{stats.length}</p>
                    <p className="text-xs text-muted-foreground">Types de fichiers</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {files.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Le dossier est vide.
                </CardContent>
              </Card>
            )}

            {files.length > 0 && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Répartition par catégorie */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Répartition par catégorie</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {stats.map(({ category, count, size, percent, color }) => (
                      <div key={category} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`size-2.5 rounded-full ${color}`} />
                            <span className="text-sm font-medium">{category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {count} fichier{count > 1 ? "s" : ""}
                            </Badge>
                            <span className="w-16 text-right text-xs text-muted-foreground">
                              {formatFileSize(size)}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${color}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <p className="text-right text-xs text-muted-foreground">{percent}%</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* 10 plus grands fichiers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <ArrowUp className="size-4" weight="bold" />
                      10 plus grands fichiers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-72">
                      {largestFiles.map((file, i) => (
                        <div key={file.name}>
                          {i > 0 && <Separator />}
                          <div className="flex items-center justify-between gap-3 px-4 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground">
                                {i + 1}
                              </span>
                              <span className="truncate font-mono text-xs">{file.name}</span>
                            </div>
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              {formatFileSize(file.size)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Extensions uniques */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm">Extensions présentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(files.map((f) => f.extension).filter(Boolean)))
                        .sort()
                        .map((ext) => {
                          const count = files.filter((f) => f.extension === ext).length
                          return (
                            <Badge key={ext} variant="outline" className="font-mono text-xs">
                              .{ext}
                              <span className="ml-1 text-muted-foreground">×{count}</span>
                            </Badge>
                          )
                        })}
                      {files.some((f) => !f.extension) && (
                        <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                          sans extension ×{files.filter((f) => !f.extension).length}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
