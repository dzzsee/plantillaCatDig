import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useConfig } from '../context/config-context';

export function AdminLogin() {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navegar = useNavigate();
  const { configuracion } = useConfig();

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setCargando(true);
    setError('');
    try {
      await api.admin.login(usuario, clave);
      navegar('/admin/panel', { replace: true });
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No se pudo iniciar sesión');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="contenedor login">
      <form className="panel-formulario" onSubmit={enviar}>
        {configuracion.logo && (
          <img className="login-logo" src={configuracion.logo} alt={configuracion.nombreNegocio} />
        )}
        <h1>Acceso administrador</h1>
        <p className="ayuda">Inicia sesión con el usuario definido en la configuración del servidor.</p>

        <div className="campo">
          <label htmlFor="usuario">Usuario</label>
          <input
            id="usuario"
            autoComplete="username"
            value={usuario}
            onChange={(evento) => setUsuario(evento.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="clave">Contraseña</label>
          <input
            id="clave"
            type="password"
            autoComplete="current-password"
            value={clave}
            onChange={(evento) => setClave(evento.target.value)}
            required
          />
        </div>

        {error && <p className="mensaje-error">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={cargando}>
          {cargando ? 'Ingresando…' : 'Ingresar'}
        </button>
        <Link className="enlace-plano" to="/">
          Volver al inicio
        </Link>
      </form>
    </div>
  );
}
