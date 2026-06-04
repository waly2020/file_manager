import { NavLink } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@workspace/ui/components/sidebar"
import {
  HouseSimple,
  TextTSlash,
  FolderSimpleStar,
  Files,
  ChartPie,
  ClockCounterClockwise,
  Gear,
  FolderOpen,
} from "@phosphor-icons/react"

const mainNav = [
  { path: "/", label: "Tableau de bord", icon: HouseSimple, end: true },
  { path: "/extension-remover", label: "Suppr. extensions", icon: TextTSlash, end: false },
  { path: "/file-organizer", label: "Organisateur", icon: FolderSimpleStar, end: false },
  { path: "/batch-rename", label: "Renommage groupé", icon: Files, end: false },
  { path: "/statistics", label: "Statistiques", icon: ChartPie, end: false },
]

const bottomNav = [
  { path: "/history", label: "Historique", icon: ClockCounterClockwise, end: false },
  { path: "/settings", label: "Paramètres", icon: Gear, end: false },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FolderOpen weight="fill" className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">FileFlow</span>
            <span className="text-xs text-muted-foreground leading-tight">Gestionnaire de fichiers</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Outils</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map(({ path, label, icon: Icon, end }) => (
                <SidebarMenuItem key={path}>
                  <NavLink to={path} end={end}>
                    {({ isActive }) => (
                      <SidebarMenuButton isActive={isActive} tooltip={label}>
                        <Icon weight={isActive ? "fill" : "regular"} />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          {bottomNav.map(({ path, label, icon: Icon, end }) => (
            <SidebarMenuItem key={path}>
              <NavLink to={path} end={end}>
                {({ isActive }) => (
                  <SidebarMenuButton isActive={isActive} tooltip={label}>
                    <Icon weight={isActive ? "fill" : "regular"} />
                    <span>{label}</span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
