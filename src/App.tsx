import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LinksPage from "./pages/Links";
import MenuPage from "./pages/Menu";
import { RequireAuth } from "./lib/auth";
import PageSpinner from "./components/ui/PageSpinner";

// Admin carregado sob demanda (nao pesa o site publico)
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const LoginPage = lazy(() => import("./pages/admin/Login"));
const DashboardPage = lazy(() => import("./pages/admin/Dashboard"));
const InsightsPage = lazy(() => import("./pages/admin/Insights"));
const ProductsPage = lazy(() => import("./pages/admin/Products"));
const CategoriesPage = lazy(() => import("./pages/admin/Categories"));
const BannersPage = lazy(() => import("./pages/admin/Banners"));
const AdminLinksPage = lazy(() => import("./pages/admin/Links"));
const SettingsPage = lazy(() => import("./pages/admin/Settings"));
const AccountPage = lazy(() => import("./pages/admin/Account"));

export default function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/" element={<LinksPage />} />
        <Route path="/cardapio" element={<MenuPage />} />

        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="pratos" element={<ProductsPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="banners" element={<BannersPage />} />
          <Route path="links" element={<AdminLinksPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
          <Route path="conta" element={<AccountPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
