import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ImageUploader } from '../components/ImageUploader';
import { useConfig } from '../context/config-context';
import type { Categoria, Configuracion, DatosProducto, Producto } from '../types';
import { formatearRango } from '../utils/format';

type Pestana = 'productos' | 'categorias' | 'ajustes';

const PRODUCTO_VACIO: DatosProducto = {
  nombre: '',
  descripcion: '',
  categoriaId: null,
  precioMin: 0,
  precioMax: 0,
  imagenes: [],
  activo: true,
  orden: 0
};

function textoError(fallo: unknown, porDefecto: string): string {
  return fallo instanceof Error ? fallo.message : porDefecto;
}

export function AdminPanel() {
  const { configuracion, recargar } = useConfig();
  const navegar = useNavigate();
  const [pestana, setPestana] = useState<Pestana>('productos');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [configEditada, setConfigEditada] = useState<Configuracion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const [formulario, setFormulario] = useState<DatosProducto>(PRODUCTO_VACIO);
  const [editando, setEditando] = useState<string | null>(null);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [nombreCategoria, setNombreCategoria] = useState('');
  const [categoriaEditando, setCategoriaEditando] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.all([api.admin.datos(), api.admin.configuracion()])
      .then(([datos, config]) => {
        if (activo) {
          setProductos(datos.productos);
          setCategorias(datos.categorias);
          setConfigEditada(config);
          setCargando(false);
        }
      })
      .catch((fallo: unknown) => {
        if (activo) {
          setError(textoError(fallo, 'No se pudo cargar el panel'));
          setCargando(false);
        }
      });
    return () => {
      activo = false;
    };
  }, []);

  function notificar(mensaje: string) {
    setAviso(mensaje);
    setError('');
    window.setTimeout(() => setAviso(''), 3500);
  }

  function abrirNuevo() {
    setFormulario(PRODUCTO_VACIO);
    setEditando(null);
    setFormularioAbierto(true);
  }

  function abrirEdicion(producto: Producto) {
    setFormulario({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      categoriaId: producto.categoriaId,
      precioMin: producto.precioMin,
      precioMax: producto.precioMax,
      imagenes: [...producto.imagenes],
      activo: producto.activo,
      orden: producto.orden
    });
    setEditando(producto.id);
    setFormularioAbierto(true);
  }

  function cerrarFormulario() {
    setFormularioAbierto(false);
    setEditando(null);
    setFormulario(PRODUCTO_VACIO);
  }

  async function guardarProducto(evento: FormEvent) {
    evento.preventDefault();
    try {
      await api.admin.guardarProducto(formulario, editando ?? undefined);
      const datos = await api.admin.datos();
      setProductos(datos.productos);
      setCategorias(datos.categorias);
      cerrarFormulario();
      notificar(editando ? 'Producto actualizado' : 'Producto creado');
    } catch (fallo) {
      setError(textoError(fallo, 'No se pudo guardar el producto'));
    }
  }

  async function eliminarProducto(producto: Producto) {
    if (!window.confirm(`¿Eliminar "${producto.nombre}"?`)) return;
    try {
      await api.admin.eliminarProducto(producto.id);
      setProductos((actuales) => actuales.filter((item) => item.id !== producto.id));
      notificar('Producto eliminado');
    } catch (fallo) {
      setError(textoError(fallo, 'No se pudo eliminar el producto'));
    }
  }

  async function alternarActivo(producto: Producto) {
    try {
      await api.admin.guardarProducto(
        {
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          categoriaId: producto.categoriaId,
          precioMin: producto.precioMin,
          precioMax: producto.precioMax,
          imagenes: producto.imagenes,
          activo: !producto.activo,
          orden: producto.orden
        },
        producto.id
      );
      setProductos((actuales) =>
        actuales.map((item) => (item.id === producto.id ? { ...item, activo: !item.activo } : item))
      );
    } catch (fallo) {
      setError(textoError(fallo, 'No se pudo cambiar el estado'));
    }
  }

  async function guardarCategoria(evento: FormEvent) {
    evento.preventDefault();
    try {
      await api.admin.guardarCategoria(
        { nombre: nombreCategoria, orden: categoriaEditando ? 0 : categorias.length + 1 },
        categoriaEditando ?? undefined
      );
      const datos = await api.admin.datos();
      setCategorias(datos.categorias);
      setNombreCategoria('');
      setCategoriaEditando(null);
      notificar('Categoría guardada');
    } catch (fallo) {
      setError(textoError(fallo, 'No se pudo guardar la categoría'));
    }
  }

  async function eliminarCategoria(categoria: Categoria) {
    if (!window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return;
    try {
      await api.admin.eliminarCategoria(categoria.id);
      setCategorias((actuales) => actuales.filter((item) => item.id !== categoria.id));
      notificar('Categoría eliminada');
    } catch (fallo) {
      setError(textoError(fallo, 'No se pudo eliminar la categoría'));
    }
  }

  async function guardarAjustes(evento: FormEvent) {
    evento.preventDefault();
    if (!configEditada) return;
    try {
      const guardada = await api.admin.guardarConfiguracion(configEditada);
      setConfigEditada(guardada);
      await recargar();
      notificar('Ajustes guardados');
    } catch (fallo) {
      setError(textoError(fallo, 'No se pudieron guardar los ajustes'));
    }
  }

  async function subirLogo(archivo?: File) {
    if (!archivo || !configEditada) return;
    try {
      const [url] = await api.admin.subirImagenes([archivo]);
      if (url) setConfigEditada({ ...configEditada, logo: url });
    } catch (fallo) {
      setError(textoError(fallo, 'No se pudo subir el logo'));
    }
  }

  async function cerrarSesion() {
    await api.admin.logout().catch(() => undefined);
    navegar('/admin', { replace: true });
  }

  if (cargando) return <p className="mensaje-estado contenedor">Cargando panel…</p>;

  return (
    <div className="admin contenedor">
      <header className="admin-header">
        <div>
          {configEditada?.logo && (
            <img className="login-logo" src={configEditada.logo} alt="" />
          )}
          <h1>Panel de administración</h1>
          <p className="ayuda">Gestiona productos, categorías y la apariencia del catálogo.</p>
        </div>
        <div className="admin-acciones">
          <Link className="btn btn-secondary btn-sm" to="/catalogo">
            Ver catálogo
          </Link>
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => void cerrarSesion()}>
            Salir
          </button>
        </div>
      </header>

      <div className="pestanas" role="tablist" aria-label="Secciones del panel">
        {([
          ['productos', 'Productos'],
          ['categorias', 'Categorías'],
          ['ajustes', 'Ajustes']
        ] as const).map(([clave, etiqueta]) => (
          <button
            key={clave}
            type="button"
            role="tab"
            aria-selected={pestana === clave}
            className={pestana === clave ? 'pestana activa' : 'pestana'}
            onClick={() => setPestana(clave)}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {error && <p className="mensaje-error">{error}</p>}
      {aviso && <p className="mensaje-aviso">{aviso}</p>}

      {pestana === 'productos' && (
        <section role="tabpanel">
          <div className="seccion-cabecera">
            <h2>Productos</h2>
            <button className="btn btn-primary btn-sm" type="button" onClick={abrirNuevo}>
              + Nuevo producto
            </button>
          </div>

          {formularioAbierto && (
            <form className="panel-formulario" onSubmit={(evento) => void guardarProducto(evento)}>
              <h3>{editando ? 'Editar producto' : 'Nuevo producto'}</h3>

              <div className="campo">
                <label htmlFor="nombre-producto">Nombre</label>
                <input
                  id="nombre-producto"
                  value={formulario.nombre}
                  maxLength={120}
                  required
                  onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })}
                />
              </div>

              <div className="campo">
                <label htmlFor="descripcion-producto">Descripción</label>
                <textarea
                  id="descripcion-producto"
                  rows={4}
                  maxLength={3000}
                  value={formulario.descripcion}
                  onChange={(evento) =>
                    setFormulario({ ...formulario, descripcion: evento.target.value })
                  }
                />
              </div>

              <div className="rejilla-campos">
                <div className="campo">
                  <label htmlFor="categoria-producto">Categoría</label>
                  <select
                    id="categoria-producto"
                    value={formulario.categoriaId ?? ''}
                    onChange={(evento) =>
                      setFormulario({ ...formulario, categoriaId: evento.target.value || null })
                    }
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="campo">
                  <label htmlFor="precio-min">Precio mínimo</label>
                  <input
                    id="precio-min"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formulario.precioMin}
                    required
                    onChange={(evento) =>
                      setFormulario({ ...formulario, precioMin: Number(evento.target.value) })
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="precio-max">Precio máximo</label>
                  <input
                    id="precio-max"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formulario.precioMax}
                    required
                    onChange={(evento) =>
                      setFormulario({ ...formulario, precioMax: Number(evento.target.value) })
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="orden-producto">Orden</label>
                  <input
                    id="orden-producto"
                    type="number"
                    value={formulario.orden}
                    onChange={(evento) =>
                      setFormulario({ ...formulario, orden: Number(evento.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="campo">
                <label htmlFor="activo-producto">
                  <input
                    id="activo-producto"
                    type="checkbox"
                    checked={formulario.activo}
                    onChange={(evento) =>
                      setFormulario({ ...formulario, activo: evento.target.checked })
                    }
                  />
                  Visible en el catálogo
                </label>
              </div>

              <ImageUploader
                imagenes={formulario.imagenes}
                onChange={(imagenes) => setFormulario({ ...formulario, imagenes })}
              />

              <div className="acciones-formulario">
                <button className="btn btn-primary" type="submit">
                  Guardar
                </button>
                <button className="btn btn-secondary" type="button" onClick={cerrarFormulario}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {productos.length === 0 ? (
            <p className="mensaje-estado">Todavía no hay productos. Creá el primero.</p>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla-admin">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio de referencia</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id}>
                      <td>{producto.nombre}</td>
                      <td>
                        {categorias.find((categoria) => categoria.id === producto.categoriaId)?.nombre ?? '—'}
                      </td>
                      <td>
                        {formatearRango(producto.precioMin, producto.precioMax, configuracion.moneda)}
                      </td>
                      <td>
                        <span className={producto.activo ? 'estado activo' : 'estado'}>
                          {producto.activo ? 'Visible' : 'Oculto'}
                        </span>
                      </td>
                      <td>
                        <div className="acciones-fila">
                          <button
                            className="btn btn-secondary btn-xs"
                            type="button"
                            onClick={() => abrirEdicion(producto)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-secondary btn-xs"
                            type="button"
                            onClick={() => void alternarActivo(producto)}
                          >
                            {producto.activo ? 'Ocultar' : 'Mostrar'}
                          </button>
                          <button
                            className="btn btn-peligro btn-xs"
                            type="button"
                            onClick={() => void eliminarProducto(producto)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {pestana === 'categorias' && (
        <section role="tabpanel">
          <div className="seccion-cabecera">
            <h2>Categorías</h2>
          </div>

          <form className="panel-formulario compacto" onSubmit={(evento) => void guardarCategoria(evento)}>
            <div className="campo">
              <label htmlFor="nombre-categoria">
                {categoriaEditando ? 'Renombrar categoría' : 'Nueva categoría'}
              </label>
              <input
                id="nombre-categoria"
                value={nombreCategoria}
                maxLength={60}
                required
                onChange={(evento) => setNombreCategoria(evento.target.value)}
              />
            </div>
            <div className="acciones-formulario">
              <button className="btn btn-primary btn-sm" type="submit">
                Guardar
              </button>
              {categoriaEditando && (
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={() => {
                    setCategoriaEditando(null);
                    setNombreCategoria('');
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <ul className="lista-categorias">
            {categorias.map((categoria) => (
              <li key={categoria.id}>
                <span>{categoria.nombre}</span>
                <div className="acciones-fila">
                  <button
                    className="btn btn-secondary btn-xs"
                    type="button"
                    onClick={() => {
                      setCategoriaEditando(categoria.id);
                      setNombreCategoria(categoria.nombre);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-peligro btn-xs"
                    type="button"
                    onClick={() => void eliminarCategoria(categoria)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pestana === 'ajustes' && configEditada && (
        <section role="tabpanel">
          <div className="seccion-cabecera">
            <h2>Ajustes del catálogo</h2>
          </div>

          <form className="panel-formulario" onSubmit={(evento) => void guardarAjustes(evento)}>
            <div className="campo">
              <label htmlFor="logo-negocio">Logo</label>
              <div className="logo-editor">
                {configEditada.logo && (
                  <img src={configEditada.logo} alt="Logo actual" />
                )}
                <input
                  id="logo-negocio"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(evento) => void subirLogo(evento.target.files?.[0])}
                />
                {configEditada.logo && (
                  <button
                    className="btn btn-secondary btn-xs"
                    type="button"
                    onClick={() => setConfigEditada({ ...configEditada, logo: '' })}
                  >
                    Quitar logo
                  </button>
                )}
              </div>
            </div>

            <div className="rejilla-campos">
              <div className="campo">
                <label htmlFor="nombre-negocio">Nombre del negocio</label>
                <input
                  id="nombre-negocio"
                  value={configEditada.nombreNegocio}
                  maxLength={80}
                  onChange={(evento) =>
                    setConfigEditada({ ...configEditada, nombreNegocio: evento.target.value })
                  }
                />
              </div>
              <div className="campo">
                <label htmlFor="eslogan">Eslogan</label>
                <input
                  id="eslogan"
                  value={configEditada.eslogan}
                  maxLength={160}
                  onChange={(evento) => setConfigEditada({ ...configEditada, eslogan: evento.target.value })}
                />
              </div>
              <div className="campo">
                <label htmlFor="whatsapp">Número de WhatsApp (con código de país)</label>
                <input
                  id="whatsapp"
                  value={configEditada.whatsapp}
                  onChange={(evento) =>
                    setConfigEditada({ ...configEditada, whatsapp: evento.target.value })
                  }
                />
              </div>
              <div className="campo">
                <label htmlFor="sImbolo">Símbolo de moneda</label>
                <input
                  id="sImbolo"
                  value={configEditada.moneda.simbolo}
                  maxLength={5}
                  onChange={(evento) =>
                    setConfigEditada({
                      ...configEditada,
                      moneda: { ...configEditada.moneda, simbolo: evento.target.value }
                    })
                  }
                />
              </div>
              <div className="campo">
                <label htmlFor="codigo-moneda">Código de moneda</label>
                <input
                  id="codigo-moneda"
                  value={configEditada.moneda.codigo}
                  maxLength={10}
                  onChange={(evento) =>
                    setConfigEditada({
                      ...configEditada,
                      moneda: { ...configEditada.moneda, codigo: evento.target.value }
                    })
                  }
                />
              </div>
              <div className="campo">
                <label htmlFor="posicion-moneda">Posición del símbolo</label>
                <select
                  id="posicion-moneda"
                  value={configEditada.moneda.posicion}
                  onChange={(evento) =>
                    setConfigEditada({
                      ...configEditada,
                      moneda: {
                        ...configEditada.moneda,
                        posicion: evento.target.value as 'antes' | 'despues'
                      }
                    })
                  }
                >
                  <option value="antes">Antes del número ($100)</option>
                  <option value="despues">Después del número (100 $)</option>
                </select>
              </div>
            </div>

            <div className="campo">
              <label htmlFor="mensaje-whatsapp">Mensaje de WhatsApp (usa {'{producto}'} para el nombre)</label>
              <textarea
                id="mensaje-whatsapp"
                rows={3}
                maxLength={300}
                value={configEditada.mensajeWhatsApp}
                onChange={(evento) =>
                  setConfigEditada({ ...configEditada, mensajeWhatsApp: evento.target.value })
                }
              />
            </div>

            <fieldset className="campo colores">
              <legend>Colores</legend>
              {(['primario', 'acento', 'fondo', 'texto'] as const).map((clave) => (
                <label key={clave} htmlFor={`color-${clave}`}>
                  {clave.charAt(0).toUpperCase() + clave.slice(1)}
                  <input
                    id={`color-${clave}`}
                    type="color"
                    value={configEditada.colores[clave]}
                    onChange={(evento) =>
                      setConfigEditada({
                        ...configEditada,
                        colores: { ...configEditada.colores, [clave]: evento.target.value }
                      })
                    }
                  />
                </label>
              ))}
            </fieldset>

            <button className="btn btn-primary" type="submit">
              Guardar ajustes
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
