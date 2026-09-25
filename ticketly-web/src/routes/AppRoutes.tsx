import { Outlet, Route, Routes } from "react-router-dom"

import { Dashboard } from "@/pages/Admin/Dashboard"
import { Login } from "@/pages/Admin/Login"
import { Home } from "@/pages/Home"
import { NotFound } from "@/pages/NotFound"
import { AuthProvider } from "@/providers/auth.provider"
import { PrivateRoutes } from "./PrivateRoutes"
import { PublicRoutes } from "./PublicRoutes"

function AppRoutes() {
  return (
    <Routes>
      {/* Área do cliente: aberta, sem login */}
      <Route path="/" element={<Home />} />

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
              <Outlet />
            </PrivateRoutes>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
