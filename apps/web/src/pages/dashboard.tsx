import { useNavigate } from "react-router-dom"
import { Layout } from "@/components/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import {
  TextTSlash,
  FolderSimpleStar,
  Files,
  ChartPie,
  ClockCounterClockwise,
  ArrowRight,
  CheckCircle,
  XCircle,
  Lightning,
} from "@phosphor-icons/react"
import { useAppStore } from "@/store/app-store"
import { formatDate } from "@/lib/fs"

const features = [
  {
    path: "/extension-remover",
    title: "Suppresseur d'extensions",
    description: "Retire les extensions de fichiers en masse. image.png → image",
    icon: TextTSlash,
    badge: "Essentiel",
  },
  {
    path: "/file-organizer",
    title: "Organisateur de fichiers",
    description: "Trie automatiquement vos fichiers par type dans des dossiers dédiés.",
    icon: FolderSimpleStar,
    badge: "Populaire",
  },
  {
    path: "/batch-rename",
    title: "Renommage groupé",
    description: "Renommez des dizaines de fichiers en une seule opération.",
    icon: Files,
    badge: "Avancé",
  },
  {
    path: "/statistics",
    title: "Statistiques",
    description: "Analysez le contenu d'un dossier : types, tailles, répartition.",
    icon: ChartPie,
    badge: "Analyse",
  },
]

const operationLabels: Record<string, string> = {
  "extension-remove": "Suppression d'extensions",
  organize: "Organisation",
  "batch-rename": "Renommage groupé",
}

export function Dashboard() {
  const navigate = useNavigate()
  const history = useAppStore((s) => s.history)
  const recentHistory = history.slice(0, 5)

  const totalOps = history.length
  const totalSuccess = history.reduce((acc, e) => acc + e.successCount, 0)
  const totalErrors = history.reduce((acc, e) => acc + e.errorCount, 0)

  return (
    <Layout title="Tableau de bord" description="Bienvenue dans FileFlow, votre gestionnaire de fichiers professionnel">
      <div className="flex flex-col gap-6">
        {/* Stats globales */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Lightning className="size-5 text-primary" weight="fill" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalOps}</p>
                <p className="text-xs text-muted-foreground">Opérations effectuées</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle className="size-5 text-green-500" weight="fill" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSuccess}</p>
                <p className="text-xs text-muted-foreground">Fichiers traités avec succès</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
                <XCircle className="size-5 text-destructive" weight="fill" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalErrors}</p>
                <p className="text-xs text-muted-foreground">Erreurs rencontrées</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fonctionnalités */}
        <div>
          <h2 className="mb-3 text-sm font-semibold">Outils disponibles</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map(({ path, title, description, icon: Icon, badge }) => (
              <Card
                key={path}
                className="group cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(path)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" weight="duotone" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm">{title}</CardTitle>
                  <CardDescription className="text-xs">{description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-muted-foreground group-hover:text-foreground"
                  >
                    Ouvrir
                    <ArrowRight data-icon="inline-end" className="size-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Historique récent */}
        {recentHistory.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Opérations récentes</h2>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/history")}>
                Voir tout
                <ArrowRight data-icon="inline-end" className="size-3" />
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                {recentHistory.map((entry, i) => (
                  <div key={entry.id}>
                    {i > 0 && <Separator />}
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <ClockCounterClockwise className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {operationLabels[entry.type] ?? entry.type}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {entry.folderName} · {formatDate(entry.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="mr-1 size-3 text-green-500" />
                          {entry.successCount}
                        </Badge>
                        {entry.errorCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {entry.errorCount} err.
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {recentHistory.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <ClockCounterClockwise className="size-10 text-muted-foreground/50" weight="thin" />
              <p className="text-sm font-medium">Aucune opération effectuée</p>
              <p className="text-xs text-muted-foreground">
                Sélectionnez un outil ci-dessus pour commencer.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
