import { useState } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@workspace/ui/components/alert-dialog"
import {
  ClockCounterClockwise,
  TextTSlash,
  FolderSimpleStar,
  Files,
  CheckCircle,
  XCircle,
  Trash,
  FunnelSimple,
} from "@phosphor-icons/react"
import { useAppStore } from "@/store/app-store"
import type { OperationType } from "@/store/app-store"
import { formatDate } from "@/lib/fs"

const typeConfig: Record<OperationType, { label: string; icon: React.ComponentType<any> }> = {
  "extension-remove": { label: "Suppression ext.", icon: TextTSlash },
  organize: { label: "Organisation", icon: FolderSimpleStar },
  "batch-rename": { label: "Renommage groupé", icon: Files },
}

type FilterType = "all" | OperationType

export function History() {
  const { history, removeHistoryEntry, clearHistory } = useAppStore()
  const [filter, setFilter] = useState<FilterType>("all")

  const filtered = filter === "all" ? history : history.filter((e) => e.type === filter)

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "Tout" },
    { key: "extension-remove", label: "Extensions" },
    { key: "organize", label: "Organisation" },
    { key: "batch-rename", label: "Renommage" },
  ]

  return (
    <Layout
      title="Historique"
      description="Journal de toutes vos opérations"
      actions={
        history.length > 0 ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash data-icon="inline-start" />
                Vider l'historique
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Vider l'historique ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprimera définitivement les {history.length} entrée(s) d'historique.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={clearHistory}>Vider</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        {/* Filtres */}
        <div className="flex items-center gap-2">
          <FunnelSimple className="size-4 text-muted-foreground" />
          <div className="flex gap-1">
            {filters.map(({ key, label }) => (
              <Button
                key={key}
                variant={filter === key ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilter(key)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Badge variant="secondary" className="ml-auto text-xs">
            {filtered.length} entrée{filtered.length > 1 ? "s" : ""}
          </Badge>
        </div>

        {filtered.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <ClockCounterClockwise className="size-10 text-muted-foreground/50" weight="thin" />
              <p className="text-sm font-medium">
                {history.length === 0 ? "Aucune opération effectuée" : "Aucun résultat pour ce filtre"}
              </p>
              <p className="text-xs text-muted-foreground">
                {history.length === 0
                  ? "Les opérations apparaîtront ici une fois effectuées."
                  : "Essayez un autre filtre."}
              </p>
            </CardContent>
          </Card>
        )}

        {filtered.length > 0 && (
          <Card>
            <ScrollArea className="h-[calc(100vh-280px)]">
              {filtered.map((entry, i) => {
                const config = typeConfig[entry.type]
                const Icon = config.icon
                return (
                  <div key={entry.id}>
                    {i > 0 && <Separator />}
                    <div className="flex items-start justify-between gap-4 px-4 py-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Icon className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{entry.summary}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {config.label}
                            </Badge>
                            <span className="font-mono text-xs text-muted-foreground">
                              {entry.folderName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(entry.timestamp)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="size-3" weight="fill" />
                              {entry.successCount} succès
                            </span>
                            {entry.errorCount > 0 && (
                              <span className="flex items-center gap-1 text-xs text-destructive">
                                <XCircle className="size-3" weight="fill" />
                                {entry.errorCount} erreur{entry.errorCount > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeHistoryEntry(entry.id)}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </ScrollArea>
          </Card>
        )}
      </div>
    </Layout>
  )
}
