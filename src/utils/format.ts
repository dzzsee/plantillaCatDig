import type { Configuracion } from '../types';

export function formatearRango(min: number, max: number, moneda: Configuracion['moneda']): string {
  const formato = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
  const valor = (numero: number) => {
    const numeroFormateado = formato.format(numero);
    return moneda.posicion === 'despues'
      ? `${numeroFormateado} ${moneda.simbolo}`
      : `${moneda.simbolo}${numeroFormateado}`;
  };
  return min === max ? valor(min) : `${valor(min)} – ${valor(max)}`;
}

export function enlaceWhatsApp(configuracion: Configuracion, producto?: string): string | null {
  const numero = configuracion.whatsapp.replace(/\D/g, '');
  if (!numero) return null;
  const mensaje = (configuracion.mensajeWhatsApp || 'Hola, quisiera consultar por {producto}').replace(
    /\{producto\}/g,
    producto ?? ''
  );
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje.trim())}`;
}
