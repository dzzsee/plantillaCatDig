import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { Configuracion } from '../types';
import { ContextoConfiguracion } from './config-context';

const CONFIGURACION_DEFECTO: Configuracion = {
  nombreNegocio: 'Dilamed',
  eslogan: 'Equipos e insumos para laboratorio clínico',
  logo: '/logo.jpg',
  whatsapp: '',
  mensajeWhatsApp: 'Hola, quisiera consultar por {producto}. ¿Podrían enviarme más información y disponibilidad?',
  moneda: { simbolo: '$', codigo: 'USD', posicion: 'antes' },
  colores: {
    primario: '#2563eb',
    acento: '#f59e0b',
    fondo: '#f8fafc',
    texto: '#0f172a'
  }
};

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [configuracion, setConfiguracion] = useState<Configuracion>(CONFIGURACION_DEFECTO);

  const recargar = useCallback(async () => {
    try {
      setConfiguracion(await api.configuracion());
    } catch {
      setConfiguracion(CONFIGURACION_DEFECTO);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  useEffect(() => {
    const estilo = document.documentElement.style;
    estilo.setProperty('--color-primary', configuracion.colores.primario);
    estilo.setProperty('--color-accent', configuracion.colores.acento);
    estilo.setProperty('--color-bg', configuracion.colores.fondo);
    estilo.setProperty('--color-text', configuracion.colores.texto);
    document.title = `${configuracion.nombreNegocio} · Catálogo`;
  }, [configuracion]);

  const valor = useMemo(() => ({ configuracion, recargar }), [configuracion, recargar]);

  return (
    <ContextoConfiguracion.Provider value={valor}>{children}</ContextoConfiguracion.Provider>
  );
}
