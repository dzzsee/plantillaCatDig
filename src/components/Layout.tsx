import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../context/config-context';
import { enlaceWhatsApp } from '../utils/format';

export function Layout({ children }: { children: ReactNode }) {
  const { configuracion } = useConfig();
  const enlace = enlaceWhatsApp(configuracion);

  return (
    <div className="app">
      <header className="sitio-header">
        <Link to="/" className="marca">
          {configuracion.logo && (
            <img className="marca-logo" src={configuracion.logo} alt="" />
          )}
          <span className="marca-nombre">{configuracion.nombreNegocio}</span>
        </Link>
        <nav className="sitio-nav" aria-label="Navegación principal">
          <Link to="/">Inicio</Link>
          <Link to="/catalogo">Catálogo</Link>
          {enlace && (
            <a className="btn btn-primary btn-sm" href={enlace} target="_blank" rel="noreferrer">
              Abrir WhatsApp
            </a>
          )}
        </nav>
      </header>

      <main>{children}</main>

      <footer className="sitio-footer">
        <span>{configuracion.nombreNegocio}</span>
        <Link to="/admin">Administrar catálogo</Link>
      </footer>
    </div>
  );
}
