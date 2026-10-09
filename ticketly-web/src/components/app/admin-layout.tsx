import { Fragment } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"

import { AdminSidebar } from "@/components/app/admin-sidebar"
import { ThemeToggle } from "@/components/app/theme-toggle"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Dashboard",
  shows: "Shows",
  artistas: "Artistas",
  novo: "Novo",
}

function getCrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)

  return segments.map((segment, index) => ({
    label: SEGMENT_LABELS[segment] ?? "Editar",
    url: `/${segments.slice(0, index + 1).join("/")}`,
  }))
}

export function AdminLayout() {
  const { pathname } = useLocation()
  const crumbs = getCrumbs(pathname)

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 rounded-t-[inherit] border-b bg-background/80 px-4 backdrop-blur-xl">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4!" />
          <Breadcrumb>
            <BreadcrumbList>
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1

                return (
                  <Fragment key={crumb.url}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink render={<Link to={crumb.url} />}>
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
