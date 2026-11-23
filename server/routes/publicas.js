import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import {
  getConfiguracion,
  getProducto,
  listarCategorias,
  listarProductos
} from '../lib/storage.js';

const router = Router();
const ORDENES = ['nombre_asc', 'nombre_desc', 'precio_asc', 'precio_desc'];

router.get(
  '/configuracion',
  asyncHandler(async (_req, res) => {
    res.json(await getConfiguracion());
  })
);

router.get(
  '/categorias',
  asyncHandler(async (_req, res) => {
    const [categorias, productos] = await Promise.all([listarCategorias(), listarProductos()]);
    const activos = productos.filter((producto) => producto.activo);
    const resultado = categorias
      .map((categoria) => ({
        ...categoria,
        total: activos.filter((producto) => producto.categoriaId === categoria.id).length
      }))
      .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'));
    res.json(resultado);
  })
);

router.get(
  '/productos',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? '').trim().toLocaleLowerCase('es');
    const categoria = String(req.query.categoria ?? '');
    const ordenRecibido = String(req.query.orden ?? '');
    const orden = ORDENES.includes(ordenRecibido) ? ordenRecibido : 'nombre_asc';

    let productos = (await listarProductos()).filter((producto) => producto.activo);

    if (q) {
      productos = productos.filter((producto) =>
        `${producto.nombre} ${producto.descripcion}`.toLocaleLowerCase('es').includes(q)
      );
    }
    if (categoria) {
      productos = productos.filter((producto) => producto.categoriaId === categoria);
    }

    productos.sort((a, b) => {
      switch (orden) {
        case 'precio_asc':
          return a.precioMin - b.precioMin || a.nombre.localeCompare(b.nombre, 'es');
        case 'precio_desc':
          return b.precioMax - a.precioMax || a.nombre.localeCompare(b.nombre, 'es');
        case 'nombre_desc':
          return b.nombre.localeCompare(a.nombre, 'es');
        default:
          return a.nombre.localeCompare(b.nombre, 'es');
      }
    });

    res.json(productos);
  })
);

router.get(
  '/productos/:id',
  asyncHandler(async (req, res) => {
    const producto = await getProducto(req.params.id);
    if (!producto || !producto.activo) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    return res.json(producto);
  })
);

export default router;
