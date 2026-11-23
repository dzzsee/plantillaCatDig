import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { CategoryFilter } from '../components/CategoryFilter';
import { ProductCard } from '../components/ProductCard';
import { SearchBar } from '../components/SearchBar';
import { SortSelect } from '../components/SortSelect';
import { useConfig } from '../context/config-context';
import type { Categoria, Producto } from '../types';
import { enlaceWhatsApp } from '../utils/format';

export function Catalogo() {
  const { configuracion } = useConfig();
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDiferida, setBusquedaDiferida] = useState('');
  const [categoria, setCategoria] = useState(
    () => new URLSearchParams(window.location.search).get('categoria') ?? ''
  );
  const [orden, setOrden] = useState('nombre_asc');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const enlace = enlaceWhatsApp(configuracion);

  useEffect(() => {
    const temporizador = window.setTimeout(() => setBusquedaDiferida(busqueda), 300);
    return () => window.clearTimeout(temporizador);
  }, [busqueda]);

  useEffect(() => {
    api.categorias().then(setCategorias).catch(() => undefined);
  }, []);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    api
      .productos({ q: busquedaDiferida, categoria, orden })
      .then((datos) => {
        if (activo) {
          setProductos(datos);
          setCargando(false);
        }
      })
      .catch((fallo: unknown) => {
        if (activo) {
          setError(fallo instanceof Error ? fallo.message : 'No se pudo cargar el catálogo');
          setCargando(false);
        }
      });
    return () => {
      activo = false;
    };
  }, [busquedaDiferida, categoria, orden]);

  return (
    <div className="contenedor pagina-catalogo">
      <section className="portada">
        <div className="portada-titulo">
          <h1>{configuracion.nombreNegocio}</h1>
          <p>{configuracion.eslogan}</p>
        </div>
        <div className="portada-nota">
          <p>Explora el catálogo y solicita una cotización por WhatsApp.</p>
          {enlace && (
            <a className="btn btn-primary" href={enlace} target="_blank" rel="noreferrer">
              Abrir WhatsApp
            </a>
          )}
        </div>
      </section>

      <div className="area-catalogo">
        <aside className="indice" aria-label="Filtros del catálogo">
          <SearchBar valor={busqueda} onChange={setBusqueda} />
          <h2>Categorías</h2>
          <CategoryFilter categorias={categorias} valor={categoria} onChange={setCategoria} />
        </aside>

        <section className="listado" aria-label="Productos">
          <div className="listado-cabecera">
            <p>{productos.length} productos</p>
            <SortSelect valor={orden} onChange={setOrden} />
          </div>

          {error && <p className="mensaje-error">{error}</p>}

          {cargando ? (
            <p className="mensaje-estado">Cargando productos…</p>
          ) : productos.length === 0 ? (
            <div className="estado-vacio">
              <h2>No hay productos con esa búsqueda</h2>
              <p>Prueba con otra palabra o revisa todas las categorías.</p>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => {
                setBusqueda('');
                setCategoria('');
              }}>
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className="lista-productos">
              {productos.map((producto) => (
                <ProductCard key={producto.id} producto={producto} categorias={categorias} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
