import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { GaleriaProducto } from '../components/GaleriaProducto';
import { ProductCard } from '../components/ProductCard';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { useConfig } from '../context/config-context';
import type { Categoria, Producto } from '../types';
import { formatearRango } from '../utils/format';

export function ProductoDetalle() {
  const { id } = useParams();
  const { configuracion } = useConfig();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [relacionados, setRelacionados] = useState<Producto[]>([]);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');

  useEffect(() => {
    if (!id) return;
    let activo = true;
    setEstado('cargando');

    Promise.all([api.producto(id), api.categorias()])
      .then(async ([productoEncontrado, categoriasEncontradas]) => {
        const mismos = await api.productos({ categoria: productoEncontrado.categoriaId ?? '' });
        if (activo) {
          setProducto(productoEncontrado);
          setCategorias(categoriasEncontradas);
          setRelacionados(mismos.filter((item) => item.id !== productoEncontrado.id).slice(0, 4));
          setEstado('listo');
        }
      })
      .catch(() => {
        if (activo) setEstado('error');
      });

    return () => {
      activo = false;
    };
  }, [id]);

  if (estado === 'cargando') return <p className="mensaje-estado contenedor">Cargando producto…</p>;
  if (estado === 'error' || !producto) {
    return (
      <div className="contenedor estado-vacio">
        <h1>Producto no encontrado</h1>
        <p>Puede que ya no esté disponible.</p>
        <Link className="btn btn-primary" to="/catalogo">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const categoria = categorias.find((item) => item.id === producto.categoriaId);

  return (
    <div className="contenedor">
      <nav className="migas" aria-label="Ruta de navegación">
        <Link to="/catalogo">Catálogo</Link>
        {categoria && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/?categoria=${encodeURIComponent(categoria.id)}`}>{categoria.nombre}</Link>
          </>
        )}
      </nav>

      <article className="detalle-producto">
        <GaleriaProducto imagenes={producto.imagenes} nombre={producto.nombre} />

        <div className="detalle-info">
          {categoria && <span className="etiqueta">{categoria.nombre}</span>}
          <h1>{producto.nombre}</h1>
          <p className="precio precio-grande">
            {formatearRango(producto.precioMin, producto.precioMax, configuracion.moneda)}
          </p>
          <p className="descripcion">{producto.descripcion || 'Sin descripción disponible.'}</p>
          <WhatsAppButton producto={producto} etiqueta="Consultar disponibilidad" />
          <p className="ayuda">Precios de referencia. Consúltanos por disponibilidad y condiciones.</p>
        </div>
      </article>

      {relacionados.length > 0 && (
        <section className="seccion-relacionados">
          <h2>Productos relacionados</h2>
          <div className="rejilla-productos">
            {relacionados.map((item) => (
              <ProductCard key={item.id} producto={item} categorias={categorias} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
