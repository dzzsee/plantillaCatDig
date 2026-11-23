import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { HttpError } from './httpError.js';
import { DATA_DIR } from './paths.js';

const RUTA_CATALOGO = path.join(DATA_DIR, 'catalogo.json');
const RUTA_CONFIGURACION = path.join(DATA_DIR, 'configuracion.json');

const CATALOGO_INICIAL = {
  productos: [
    {
      id: 'demo-1',
      nombre: 'Analizador de química clínica',
      descripcion:
        'Equipo semiautomático para determinaciones de química clínica, con lectura fotométrica y resultados en pantalla. Consulta por configuración y reactivos disponibles.',
      categoriaId: 'cat-analizadores',
      precioMin: 4500,
      precioMax: 6200,
      imagenes: [
        '/uploads/ejemplo-analizador.svg',
        '/uploads/ejemplo-analizador-detalle.svg',
        '/uploads/ejemplo-analizador-lateral.svg'
      ],
      activo: true,
      orden: 1,
      creadoEn: '2026-01-01T00:00:00.000Z',
      actualizadoEn: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'demo-2',
      nombre: 'Microscopio binocular de laboratorio',
      descripcion:
        'Microscopio binocular con iluminación LED, platina mecánica y objetivos de 4x, 10x, 40x y 100x. Incluye estuche y manual de uso.',
      categoriaId: 'cat-microscopia',
      precioMin: 1200,
      precioMax: 1800,
      imagenes: [
        '/uploads/ejemplo-microscopio.svg',
        '/uploads/ejemplo-microscopio-objetivos.svg',
        '/uploads/ejemplo-microscopio-lateral.svg'
      ],
      activo: true,
      orden: 2,
      creadoEn: '2026-01-01T00:00:00.000Z',
      actualizadoEn: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'demo-3',
      nombre: 'Centrífuga de mesa',
      descripcion:
        'Centrífuga de baja velocidad para tubos de 10 y 15 ml, con control de tiempo y velocidad. Indicada para laboratorios clínicos de pequeño y mediano volumen.',
      categoriaId: 'cat-centrifugado',
      precioMin: 850,
      precioMax: 1300,
      imagenes: [
        '/uploads/ejemplo-centrifuga.svg',
        '/uploads/ejemplo-centrifuga-rotor.svg',
        '/uploads/ejemplo-centrifuga-panel.svg'
      ],
      activo: true,
      orden: 3,
      creadoEn: '2026-01-01T00:00:00.000Z',
      actualizadoEn: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'demo-4',
      nombre: 'Set de micropipetas ajustables',
      descripcion:
        'Conjunto de micropipetas de volumen variable con punta desechable. Disponibles en distintos rangos; consulta por modelo y cantidad.',
      categoriaId: 'cat-insumos',
      precioMin: 90,
      precioMax: 180,
      imagenes: [
        '/uploads/ejemplo-pipetas.svg',
        '/uploads/ejemplo-pipetas-detalle.svg',
        '/uploads/ejemplo-pipetas-set.svg'
      ],
      activo: true,
      orden: 4,
      creadoEn: '2026-01-01T00:00:00.000Z',
      actualizadoEn: '2026-01-01T00:00:00.000Z'
    }
  ],
  categorias: [
    { id: 'cat-analizadores', nombre: 'Analizadores', orden: 1 },
    { id: 'cat-microscopia', nombre: 'Microscopía', orden: 2 },
    { id: 'cat-centrifugado', nombre: 'Centrifugado', orden: 3 },
    { id: 'cat-insumos', nombre: 'Insumos y consumibles', orden: 4 }
  ]
};

const CONFIGURACION_INICIAL = {
  nombreNegocio: 'Dilamed',
  eslogan: 'Equipos e insumos para laboratorio clínico',
  logo: '/logo.jpg',
  whatsapp: '5215555555555',
  mensajeWhatsApp: 'Hola, quisiera consultar por *{producto}*. ¿Podrían enviarme más información y disponibilidad?',
  moneda: { simbolo: '$', codigo: 'USD', posicion: 'antes' },
  colores: {
    primario: '#4a2e50',
    acento: '#9bc2d6',
    fondo: '#f2f8fc',
    texto: '#3b2540'
  }
};

let cola = Promise.resolve();

async function escribir(archivo, datos) {
  await fs.mkdir(path.dirname(archivo), { recursive: true });
  const temporal = `${archivo}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(temporal, `${JSON.stringify(datos, null, 2)}\n`, 'utf8');
  await fs.rename(temporal, archivo);
}

async function leer(archivo, inicial) {
  try {
    return JSON.parse(await fs.readFile(archivo, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      const copia = structuredClone(inicial);
      await escribir(archivo, copia);
      return copia;
    }
    throw error;
  }
}

function enCola(tarea) {
  const resultado = cola.then(tarea, tarea);
  cola = resultado.then(() => undefined, () => undefined);
  return resultado;
}

function nuevoId() {
  return crypto.randomUUID();
}

function ahora() {
  return new Date().toISOString();
}

export function getConfiguracion() {
  return leer(RUTA_CONFIGURACION, CONFIGURACION_INICIAL);
}

export function listarProductos() {
  return leer(RUTA_CATALOGO, CATALOGO_INICIAL).then((datos) => datos.productos);
}

export function getProducto(id) {
  return listarProductos().then((productos) => productos.find((p) => p.id === id) ?? null);
}

export function listarCategorias() {
  return leer(RUTA_CATALOGO, CATALOGO_INICIAL).then((datos) => datos.categorias);
}

export function crearProducto(datos) {
  return enCola(async () => {
    const catalogo = await leer(RUTA_CATALOGO, CATALOGO_INICIAL);
    const producto = {
      ...datos,
      id: nuevoId(),
      creadoEn: ahora(),
      actualizadoEn: ahora()
    };
    catalogo.productos.push(producto);
    await escribir(RUTA_CATALOGO, catalogo);
    return producto;
  });
}

export function actualizarProducto(id, datos) {
  return enCola(async () => {
    const catalogo = await leer(RUTA_CATALOGO, CATALOGO_INICIAL);
    const indice = catalogo.productos.findIndex((p) => p.id === id);
    if (indice === -1) throw new HttpError(404, 'Producto no encontrado');
    const producto = {
      ...catalogo.productos[indice],
      ...datos,
      id,
      actualizadoEn: ahora()
    };
    catalogo.productos[indice] = producto;
    await escribir(RUTA_CATALOGO, catalogo);
    return producto;
  });
}

export function eliminarProducto(id) {
  return enCola(async () => {
    const catalogo = await leer(RUTA_CATALOGO, CATALOGO_INICIAL);
    const producto = catalogo.productos.find((p) => p.id === id);
    if (!producto) throw new HttpError(404, 'Producto no encontrado');
    catalogo.productos = catalogo.productos.filter((p) => p.id !== id);
    await escribir(RUTA_CATALOGO, catalogo);
    return producto;
  });
}

export function crearCategoria(datos) {
  return enCola(async () => {
    const catalogo = await leer(RUTA_CATALOGO, CATALOGO_INICIAL);
    const categoria = { id: nuevoId(), ...datos };
    catalogo.categorias.push(categoria);
    await escribir(RUTA_CATALOGO, catalogo);
    return categoria;
  });
}

export function actualizarCategoria(id, datos) {
  return enCola(async () => {
    const catalogo = await leer(RUTA_CATALOGO, CATALOGO_INICIAL);
    const indice = catalogo.categorias.findIndex((c) => c.id === id);
    if (indice === -1) throw new HttpError(404, 'Categoría no encontrada');
    const categoria = { ...catalogo.categorias[indice], ...datos, id };
    catalogo.categorias[indice] = categoria;
    await escribir(RUTA_CATALOGO, catalogo);
    return categoria;
  });
}

export function eliminarCategoria(id) {
  return enCola(async () => {
    const catalogo = await leer(RUTA_CATALOGO, CATALOGO_INICIAL);
    if (!catalogo.categorias.some((c) => c.id === id)) {
      throw new HttpError(404, 'Categoría no encontrada');
    }
    if (catalogo.productos.some((p) => p.categoriaId === id)) {
      throw new HttpError(409, 'No se puede eliminar: hay productos que usan esta categoría');
    }
    catalogo.categorias = catalogo.categorias.filter((c) => c.id !== id);
    await escribir(RUTA_CATALOGO, catalogo);
    return { ok: true };
  });
}

export function actualizarConfiguracion(datos) {
  return enCola(async () => {
    const actual = await leer(RUTA_CONFIGURACION, CONFIGURACION_INICIAL);
    const configuracion = {
      ...actual,
      ...datos,
      moneda: { ...actual.moneda, ...(datos.moneda ?? {}) },
      colores: { ...actual.colores, ...(datos.colores ?? {}) }
    };
    await escribir(RUTA_CONFIGURACION, configuracion);
    return configuracion;
  });
}
