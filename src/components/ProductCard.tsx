import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../context/config-context';
import type { Categoria, Producto } from '../types';
import { formatearRango } from '../utils/format';
import { WhatsAppButton } from './WhatsAppButton';

interface Props {
  producto: Producto;
  categorias: Categoria[];
}

export function ProductCard({ producto, categorias }: Props) {
  const { configuracion } = useConfig();
  const categoria = categorias.find((item) => item.id === producto.categoriaId);
  const [indice, setIndice] = useState(0);
  const total = producto.imagenes.length;
  const imagen = producto.imagenes[indice];

  const cambiarImagen = (paso: number) => {
    setIndice((actual) => (actual + paso + total) % total);
  };

  return (
    <article className="tarjeta-producto">
      <div className="tarjeta-imagen">
        <Link
          to={`/producto/${producto.id}`}
          className="tarjeta-imagen-enlace"
          aria-label={`Ver ${producto.nombre}`}
        >
          {imagen ? (
            <img src={imagen} alt={producto.nombre} loading="lazy" />
          ) : (
            <span className="imagen-vacia" aria-hidden="true">
              {producto.nombre.charAt(0).toUpperCase()}
            </span>
          )}
        </Link>
        {total > 1 && (
          <>
            <button
              className="tarjeta-flecha anterior"
              type="button"
              onClick={() => cambiarImagen(-1)}
              aria-label={`Imagen anterior de ${producto.nombre}`}
            >
              ‹
            </button>
            <button
              className="tarjeta-flecha siguiente"
              type="button"
              onClick={() => cambiarImagen(1)}
              aria-label={`Imagen siguiente de ${producto.nombre}`}
            >
              ›
            </button>
            <span className="tarjeta-contador" aria-live="polite">
              {indice + 1}/{total}
            </span>
          </>
        )}
      </div>
      <div className="tarjeta-cuerpo">
        {categoria && <span className="etiqueta">{categoria.nombre}</span>}
        <h3>
          <Link to={`/producto/${producto.id}`}>{producto.nombre}</Link>
        </h3>
        <p className="extracto">{producto.descripcion}</p>
        <p className="precio">{formatearRango(producto.precioMin, producto.precioMax, configuracion.moneda)}</p>
        <div className="tarjeta-acciones">
          <Link className="btn btn-secondary btn-sm" to={`/producto/${producto.id}`}>
            Ver detalle
          </Link>
          <WhatsAppButton producto={producto} etiqueta="Consultar" className="btn-sm" />
        </div>
      </div>
    </article>
  );
}
