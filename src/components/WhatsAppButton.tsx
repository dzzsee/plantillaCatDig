import { useConfig } from '../context/config-context';
import type { Producto } from '../types';
import { enlaceWhatsApp } from '../utils/format';

interface Props {
  producto?: Producto;
  etiqueta?: string;
  className?: string;
}

export function WhatsAppButton({ producto, etiqueta = 'Consultar por WhatsApp', className = '' }: Props) {
  const { configuracion } = useConfig();
  const enlace = enlaceWhatsApp(configuracion, producto?.nombre);
  if (!enlace) return null;

  return (
    <a
      className={`btn btn-whatsapp ${className}`}
      href={enlace}
      target="_blank"
      rel="noreferrer"
      aria-label={producto ? `Consultar ${producto.nombre} por WhatsApp` : 'Consultar por WhatsApp'}
    >
      {etiqueta}
    </a>
  );
}
