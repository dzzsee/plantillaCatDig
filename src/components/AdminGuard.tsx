import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api/client';

export function AdminGuard({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<'verificando' | 'autorizado' | 'denegado'>('verificando');

  useEffect(() => {
    let activo = true;
    api.admin
      .datos()
      .then(() => {
        if (activo) setEstado('autorizado');
      })
      .catch(() => {
        if (activo) setEstado('denegado');
      });
    return () => {
      activo = false;
    };
  }, []);

  if (estado === 'verificando') return <p className="mensaje-estado">Verificando acceso…</p>;
  if (estado === 'denegado') return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
