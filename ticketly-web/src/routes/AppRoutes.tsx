import { Outlet, Route, Routes } from "react-router-dom"

import { AdminLayout } from "@/components/app/admin-layout"
import { StoreLayout } from "@/components/app/store-layout"
import { ArtistList } from "@/pages/Admin/Artists"
import { ArtistFormPage } from "@/pages/Admin/Artists/Form"
import { Dashboard } from "@/pages/Admin/Dashboard"
import { EventList } from "@/pages/Admin/Events"
import { EventFormPage } from "@/pages/Admin/Events/Form"
import { Login } from "@/pages/Admin/Login"
import { Home } from "@/pages/Home"
import { NotFound } from "@/pages/NotFound"
import { ArtistsProvider } from "@/providers/artists.provider"
import { AuthProvider } from "@/providers/auth.provider"
import { DashboardProvider } from "@/providers/dashboard.provider"
import { EventsProvider } from "@/providers/events.provider"
import { PrivateRoutes } from "./PrivateRoutes"
import { PublicRoutes } from "./PublicRoutes"

function AppRoutes() {
  return (
    <Routes>
      {/* Área do cliente: aberta, sem login */}
      <Route element={<StoreLayout />}>
        <Route index element={<Home />} />
      </Route>

      {/* Área admin: o AuthProvider só existe aqui dentro, então o cliente
          nunca espera validação de token */}
      <Route
        path="/admin"
        element={
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        }
      >
        <Route
          path="login"
          element={
            <PublicRoutes>
              <Login />
            </PublicRoutes>
          }
        />

        <Route
          element={
            <PrivateRoutes>
              <DashboardProvider>
                <ArtistsProvider>
                  <EventsProvider>
                    <AdminLayout />
                  </EventsProvider>
                </ArtistsProvider>
              </DashboardProvider>
            </PrivateRoutes>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="shows" element={<EventList />} />
          <Route path="shows/novo" element={<EventFormPage />} />
          <Route path="shows/:id" element={<EventFormPage />} />
          <Route path="artistas" element={<ArtistList />} />
          <Route path="artistas/novo" element={<ArtistFormPage />} />
          <Route path="artistas/:id" element={<ArtistFormPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
