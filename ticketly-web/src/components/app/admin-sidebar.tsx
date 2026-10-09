import {
  CalendarDaysIcon,
  ChevronsUpDownIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MicVocalIcon,
  ReceiptTextIcon,
  StoreIcon,
  type LucideIcon,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { Logo } from "@/components/app/logo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { getInitials } from "@/utils"

type TNavItem = {
  title: string
  url: string
  icon: LucideIcon
  exact?: boolean
  soon?: boolean
}

const NAV_GROUPS: { label: string; items: TNavItem[] }[] = [
  {
    label: "Geral",
    items: [
      {
        title: "Dashboard",
        url: "/admin",
        icon: LayoutDashboardIcon,
        exact: true,
      },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { title: "Shows", url: "/admin/shows", icon: CalendarDaysIcon },
      { title: "Artistas", url: "/admin/artistas", icon: MicVocalIcon },
    ],
  },
  {
    label: "Operação",
    items: [
      {
        title: "Pedidos",
        url: "/admin/pedidos",
        icon: ReceiptTextIcon,
        soon: true,
      },
    ],
  },
]

export function AdminSidebar() {
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  const isActive = (item: TNavItem) =>
    item.exact ? pathname === item.url : pathname.startsWith(item.url)

  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link to="/admin" onClick={closeOnMobile} />}
            >
              <Logo showText={false} />
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">Ticketly</span>
                <span className="truncate text-xs text-muted-foreground">
                  Painel administrativo
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    {item.soon ? (
                      <SidebarMenuButton
                        disabled
                        tooltip={`${item.title} (em breve)`}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        isActive={isActive(item)}
                        tooltip={item.title}
                        render={<Link to={item.url} onClick={closeOnMobile} />}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    )}
                    {item.soon && (
                      <SidebarMenuBadge>
                        <Badge variant="secondary">Em breve</Badge>
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="aria-expanded:bg-sidebar-accent"
              />
            }
          >
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(user?.name) || "AD"}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user?.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
            className="w-56"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Conectado como {user?.name}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link to="/" />}>
              <StoreIcon />
              Ver loja
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={logout}>
              <LogOutIcon />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
