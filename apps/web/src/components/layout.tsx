import type { ReactNode } from "react"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar"
import { Separator } from "@workspace/ui/components/separator"
import { AppSidebar } from "./app-sidebar"

interface LayoutProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function Layout({ title, description, actions, children }: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-1 h-4" />
          <div className="flex flex-1 items-center justify-between gap-4">
            <div>
              <h1 className="text-sm font-semibold leading-tight">{title}</h1>
              {description && (
                <p className="text-xs text-muted-foreground leading-tight">{description}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-6 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
