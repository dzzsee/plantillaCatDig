import type {
  Categoria,
  Configuracion,
  DatosCategoria,
  DatosProducto,
  Producto
} from '../types';

async function responder<T>(respuesta: Response): Promise<T> {
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(datos?.error || 'No se pudo completar la solicitud');
  }
  return datos as T;
}

async function peticion<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const esFormulario = opciones.body instanceof FormData;
  const respuesta = await fetch(`/api${ruta}`, {
    credentials: 'same-origin',
    ...opciones,
    headers: {
      ...(esFormulario ? {} : { 'Content-Type': 'application/json' }),
      ...(opciones.headers ?? {})
    }
  });
  return responder<T>(respuesta);
}

function consulta(parametros: Record<string, string>): string {
  const busqueda = new URLSearchParams();
  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor) busqueda.set(clave, valor);
  });
  const resultado = busqueda.toString();
  return resultado ? `?${resultado}` : '';
}

export const api = {
  configuracion: () => peticion<Configuracion>('/configuracion'),

  categorias: () => peticion<Categoria[]>('/categorias'),

  productos: (filtros: { q?: string; categoria?: string; orden?: string } = {}) =>
    peticion<Producto[]>(`/productos${consulta(filtros)}`),

  producto: (id: string) => peticion<Producto>(`/productos/${encodeURIComponent(id)}`),

  admin: {
    login: (usuario: string, clave: string) =>
      peticion<{ ok: boolean }>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ usuario, clave })
      }),

    logout: () => peticion<{ ok: boolean }>('/admin/logout', { method: 'POST' }),

    datos: () =>
      peticion<{ productos: Producto[]; categorias: Categoria[] }>('/admin/productos'),

    guardarProducto: (datos: DatosProducto, id?: string) =>
      peticion<Producto>(`/admin/productos${id ? `/${encodeURIComponent(id)}` : ''}`, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(datos)
      }),

    eliminarProducto: (id: string) =>
      peticion<{ ok: boolean }>(`/admin/productos/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      }),

    guardarCategoria: (datos: DatosCategoria, id?: string) =>
      peticion<Categoria>(`/admin/categorias${id ? `/${encodeURIComponent(id)}` : ''}`, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(datos)
      }),

    eliminarCategoria: (id: string) =>
      peticion<{ ok: boolean }>(`/admin/categorias/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      }),

    configuracion: () => peticion<Configuracion>('/admin/configuracion'),

    guardarConfiguracion: (datos: Configuracion) =>
      peticion<Configuracion>('/admin/configuracion', {
        method: 'PUT',
        body: JSON.stringify(datos)
      }),

    subirImagenes: (archivos: File[]) => {
      const formulario = new FormData();
      archivos.forEach((archivo) => formulario.append('imagenes', archivo));
      return peticion<string[]>('/admin/uploads', {
        method: 'POST',
        body: formulario
      });
    },

    eliminarImagen: (url: string) =>
      peticion<{ ok: boolean }>('/admin/uploads', {
        method: 'DELETE',
        body: JSON.stringify({ url })
      })
  }
};
