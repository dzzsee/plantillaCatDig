import { createContext, useContext } from 'react';
import type { Configuracion } from '../types';

export interface ValorConfiguracion {
  configuracion: Configuracion;
  recargar: () => Promise<void>;
}

export const ContextoConfiguracion = createContext<ValorConfiguracion | null>(null);

export function useConfig(): ValorConfiguracion {
  const contexto = useContext(ContextoConfiguracion);
  if (!contexto) throw new Error('useConfig debe usarse dentro de ConfigProvider');
  return contexto;
}
