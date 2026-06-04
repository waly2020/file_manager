import { Layout } from "@/components/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Switch } from "@workspace/ui/components/switch"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@workspace/ui/components/alert-dialog"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  Gear,
  ArrowCounterClockwise,
  Moon,
  Sun,
  Monitor,
  ShieldCheck,
  Tag,
} from "@phosphor-icons/react"
import { useAppStore } from "@/store/app-store"
import { useTheme } from "@/components/theme-provider"

export function Settings() {
  const { settings, updateSettings, resetCategories } = useAppStore()
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: "light" as const, label: "Clair", icon: Sun },
    { value: "dark" as const, label: "Sombre", icon: Moon },
    { value: "system" as const, label: "Système", icon: Monitor },
  ]

  return (
    <Layout title="Paramètres" description="Personnalisez le comportement de FileFlow">
      <div className="flex flex-col gap-6 max-w-2xl">
        {/* Apparence */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sun className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Apparence</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Choisissez le thème de l'interface.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {themes.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme(value)}
                  className="flex-1"
                >
                  <Icon data-icon="inline-start" />
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comportement */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Comportement</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Options de sécurité et de confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">Confirmation avant opération</p>
                <p className="text-xs text-muted-foreground">
                  Demander une confirmation avant chaque opération de fichiers.
                </p>
              </div>
              <Switch
                checked={settings.confirmBeforeOperation}
                onCheckedChange={(checked) => updateSettings({ confirmBeforeOperation: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Catégories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm">Catégories d'organisation</CardTitle>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <ArrowCounterClockwise data-icon="inline-start" />
                    Réinitialiser
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Réinitialiser les catégories ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Toutes les personnalisations de catégories seront perdues.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={resetCategories}>Réinitialiser</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <CardDescription className="text-xs">
              Ces catégories sont utilisées par l'organisateur de fichiers.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-72">
              {settings.categories.map((cat, i) => (
                <div key={cat.name}>
                  {i > 0 && <Separator />}
                  <div className="flex items-start justify-between gap-4 px-4 py-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{cat.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            → {cat.folderName}/
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {cat.extensions.length > 0
                            ? cat.extensions.map((e) => `.${e}`).join(", ")
                            : "Tous les autres fichiers"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {cat.extensions.length || "∞"} ext.
                    </Badge>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Informations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gear className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">À propos de FileFlow</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Version</span>
              <Badge variant="secondary">0.1.0</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Stack</span>
              <span className="font-mono text-xs text-muted-foreground">React 19 · Vite · shadcn/ui</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">API</span>
              <span className="text-xs text-muted-foreground">File System Access API</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
