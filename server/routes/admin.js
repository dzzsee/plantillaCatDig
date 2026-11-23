import crypto from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { UPLOAD_DIR } from '../lib/paths.js';
import { eliminarImagenes } from '../lib/uploads.js';
import {
  actualizarCategoria,
  actualizarConfiguracion,
  actualizarProducto,
  crearCategoria,
  crearProducto,
  eliminarCategoria,
  eliminarProducto,
  getConfiguracion,
  getProducto,
  listarCategorias,
  listarProductos
} from '../lib/storage.js';
import {
  credencialesValidas,
  generarToken,
  nombreCookie,
  opcionesCookie,
  requerirAuth
} from '../middleware/auth.js';

const router = Router();
const TIPOS_IMAGEN = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const COLOR = /^#[0-9a-fA-F]{6}$/;

const subida = multer({
  storage: multer.diskStorage({
    destination: (_req, _archivo, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, archivo, cb) => {
      const extension = path.extname(archivo.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${extension}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, archivo, cb) => {
    if (!TIPOS_IMAGEN.has(archivo.mimetype)) return cb(new HttpError(400, 'Formato de imagen no permitido'));
    return cb(null, true);
  }
});

const intentos = new Map();
const LIMITE_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;

function puedeIntentar(ip) {
  const registro = intentos.get(ip);
  if (!registro) return true;
  if (Date.now() - registro.inicio > VENTANA_MS) {
    intentos.delete(ip);
    return true;
  }
  return registro.fallos < LIMITE_INTENTOS;
}

function registrarFallo(ip) {
  const registro = intentos.get(ip) ?? { fallos: 0, inicio: Date.now() };
  registro.fallos += 1;
  intentos.set(ip, registro);
}

function texto(valor, porDefecto, maximo) {
  if (typeof valor !== 'string' || !valor.trim()) return porDefecto;
  return valor.trim().slice(0, maximo);
}

function color(valor, porDefecto) {
  return typeof valor === 'string' && COLOR.test(valor) ? valor : porDefecto;
}

function normalizarProducto(body, categorias) {
  const nombre = texto(body?.nombre, '', 120);
  if (!nombre) throw new HttpError(400, 'El nombre del producto es obligatorio');

  const precioMin = Number(body?.precioMin);
  const precioMax = Number(body?.precioMax);
  if (!Number.isFinite(precioMin) || precioMin < 0) {
    throw new HttpError(400, 'El precio mínimo debe ser un número mayor o igual a cero');
  }
  if (!Number.isFinite(precioMax) || precioMax < precioMin) {
    throw new HttpError(400, 'El precio máximo debe ser mayor o igual al mínimo');
  }

  const categoriaId = body?.categoriaId || null;
  if (categoriaId && !categorias.some((categoria) => categoria.id === categoriaId)) {
    throw new HttpError(400, 'La categoría seleccionada no existe');
  }

  const imagenes = Array.isArray(body?.imagenes)
    ? body.imagenes.filter((url) => typeof url === 'string' && url.startsWith('/uploads/'))
    : [];

  return {
    nombre,
    descripcion: texto(body?.descripcion, '', 3000),
    categoriaId,
    precioMin,
    precioMax,
    imagenes,
    activo: body?.activo !== false,
    orden: Number.isFinite(Number(body?.orden)) ? Number(body.orden) : 0
  };
}

function normalizarCategoria(body) {
  const nombre = texto(body?.nombre, '', 60);
  if (!nombre) throw new HttpError(400, 'El nombre de la categoría es obligatorio');
  return {
    nombre,
    orden: Number.isFinite(Number(body?.orden)) ? Number(body.orden) : 0
  };
}

function normalizarConfiguracion(body, actual) {
  const monedaRecibida = body?.moneda ?? {};
  const coloresRecibidos = body?.colores ?? {};
  const logoRecibido = typeof body?.logo === 'string' ? body.logo.trim() : null;
  let logo = actual.logo ?? '';
  if (logoRecibido === '') logo = '';
  else if (logoRecibido && (logoRecibido === '/logo.jpg' || logoRecibido.startsWith('/uploads/'))) {
    logo = logoRecibido.slice(0, 200);
  }
  return {
    nombreNegocio: texto(body?.nombreNegocio, actual.nombreNegocio, 80),
    eslogan: texto(body?.eslogan, actual.eslogan, 160),
    logo,
    whatsapp:
      String(body?.whatsapp ?? actual.whatsapp).replace(/\D/g, '').slice(0, 20) || actual.whatsapp,
    mensajeWhatsApp: texto(body?.mensajeWhatsApp, actual.mensajeWhatsApp, 300),
    moneda: {
      simbolo: texto(monedaRecibida.simbolo, actual.moneda.simbolo, 5),
      codigo: texto(monedaRecibida.codigo, actual.moneda.codigo, 10),
      posicion: ['antes', 'despues'].includes(monedaRecibida.posicion)
        ? monedaRecibida.posicion
        : actual.moneda.posicion
    },
    colores: {
      primario: color(coloresRecibidos.primario, actual.colores.primario),
      acento: color(coloresRecibidos.acento, actual.colores.acento),
      fondo: color(coloresRecibidos.fondo, actual.colores.fondo),
      texto: color(coloresRecibidos.texto, actual.colores.texto)
    }
  };
}

router.post('/login', (req, res) => {
  const ip = req.ip || 'desconocido';
  if (!puedeIntentar(ip)) {
    return res.status(429).json({ error: 'Demasiados intentos. Prueba de nuevo en unos minutos.' });
  }
  const { usuario, clave } = req.body ?? {};
  if (!credencialesValidas(usuario, clave)) {
    registrarFallo(ip);
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
  intentos.delete(ip);
  res.cookie(nombreCookie, generarToken(), opcionesCookie());
  return res.json({ ok: true, usuario });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(nombreCookie, opcionesCookie());
  res.json({ ok: true });
});

router.use(requerirAuth);

router.get(
  '/productos',
  asyncHandler(async (_req, res) => {
    const [productos, categorias] = await Promise.all([listarProductos(), listarCategorias()]);
    res.json({ productos, categorias });
  })
);

router.post(
  '/productos',
  asyncHandler(async (req, res) => {
    const datos = normalizarProducto(req.body, await listarCategorias());
    res.status(201).json(await crearProducto(datos));
  })
);

router.put(
  '/productos/:id',
  asyncHandler(async (req, res) => {
    const anterior = await getProducto(req.params.id);
    if (!anterior) throw new HttpError(404, 'Producto no encontrado');
    const datos = normalizarProducto(req.body, await listarCategorias());
    const actualizado = await actualizarProducto(req.params.id, datos);
    await eliminarImagenes(anterior.imagenes.filter((url) => !actualizado.imagenes.includes(url)));
    res.json(actualizado);
  })
);

router.delete(
  '/productos/:id',
  asyncHandler(async (req, res) => {
    const eliminado = await eliminarProducto(req.params.id);
    await eliminarImagenes(eliminado.imagenes);
    res.json({ ok: true });
  })
);

router.post(
  '/categorias',
  asyncHandler(async (req, res) => {
    res.status(201).json(await crearCategoria(normalizarCategoria(req.body)));
  })
);

router.put(
  '/categorias/:id',
  asyncHandler(async (req, res) => {
    res.json(await actualizarCategoria(req.params.id, normalizarCategoria(req.body)));
  })
);

router.delete(
  '/categorias/:id',
  asyncHandler(async (req, res) => {
    res.json(await eliminarCategoria(req.params.id));
  })
);

router.get(
  '/configuracion',
  asyncHandler(async (_req, res) => {
    res.json(await getConfiguracion());
  })
);

router.put(
  '/configuracion',
  asyncHandler(async (req, res) => {
    const actual = await getConfiguracion();
    res.json(await actualizarConfiguracion(normalizarConfiguracion(req.body, actual)));
  })
);

router.post('/uploads', subida.array('imagenes', 8), (req, res) => {
  if (!req.files?.length) throw new HttpError(400, 'No se recibieron imágenes');
  res.status(201).json(req.files.map((archivo) => `/uploads/${encodeURIComponent(archivo.filename)}`));
});

router.delete(
  '/uploads',
  asyncHandler(async (req, res) => {
    await eliminarImagenes([req.body?.url]);
    res.json({ ok: true });
  })
);

export default router;
