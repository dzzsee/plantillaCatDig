import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AdminGuard } from './components/AdminGuard';
import { Layout } from './components/Layout';
import { AdminLogin } from './pages/AdminLogin';
import { AdminPanel } from './pages/AdminPanel';
import { Catalogo } from './pages/Catalogo';
import { Inicio } from './pages/Inicio';
import { ProductoDetalle } from './pages/ProductoDetalle';

export function App() {
  return (
    <Routes>
      <Route
        element={
          <Layout>
            <Outlet />
          </Layout>
        }
      >
        <Route path="/" element={<Inicio />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/producto/:id" element={<ProductoDetalle />} />
      </Route>
      <Route path="/admin" element={<AdminLogin />} />
      <Route
        path="/admin/panel"
        element={
          <AdminGuard>
            <AdminPanel />
          </AdminGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
