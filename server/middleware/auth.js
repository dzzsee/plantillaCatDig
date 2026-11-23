import crypto from 'node:crypto';

export const nombreCookie = 'catdig_admin';

const USUARIO = process.env.ADMIN_USER || 'admin';
const CLAVE = process.env.ADMIN_PASSWORD || 'admin123';
const SECRETO = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const DURACION_SEGUNDOS = 8 * 60 * 60;
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';

const SAL = crypto.randomBytes(16).toString('hex');
const HASH = crypto.scryptSync(CLAVE, SAL, 64).toString('hex');

if (!process.env.SESSION_SECRET) {
  console.warn('[seguridad] Define SESSION_SECRET en .env para mantener las sesiones activas.');
}
if (!process.env.ADMIN_PASSWORD) {
  console.warn('[seguridad] Estás usando la contraseña por defecto. Cámbiala en .env.');
}

function derivar(clave) {
  return crypto.scryptSync(clave, SAL, 64).toString('hex');
}

function iguales(a, b) {
  return a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function credencialesValidas(usuario, clave) {
  if (typeof usuario !== 'string' || typeof clave !== 'string') return false;
  return iguales(usuario, USUARIO) && iguales(derivar(clave), HASH);
}

function firmar(datos) {
  const payload = Buffer.from(JSON.stringify(datos)).toString('base64url');
  const firma = crypto.createHmac('sha256', SECRETO).update(payload).digest('base64url');
  return `${payload}.${firma}`;
}

function tokenValido(token) {
  if (typeof token !== 'string') return false;
  const [payload, firma] = token.split('.');
  if (!payload || !firma) return false;
  const esperada = crypto.createHmac('sha256', SECRETO).update(payload).digest('base64url');
  if (!iguales(firma, esperada)) return false;
  try {
    const datos = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return datos.u === USUARIO && typeof datos.exp === 'number' && datos.exp > Date.now();
  } catch {
    return false;
  }
}

function leerCookie(cabecera, nombre) {
  if (!cabecera) return null;
  for (const parte of cabecera.split(';')) {
    const [clave, ...resto] = parte.trim().split('=');
    if (clave === nombre) return decodeURIComponent(resto.join('='));
  }
  return null;
}

export function generarToken() {
  return firmar({ u: USUARIO, exp: Date.now() + DURACION_SEGUNDOS * 1000 });
}

export function opcionesCookie() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: COOKIE_SECURE,
    path: '/',
    maxAge: DURACION_SEGUNDOS * 1000
  };
}

export function requerirAuth(req, res, next) {
  const token = leerCookie(req.headers.cookie, nombreCookie);
  if (!tokenValido(token)) return res.status(401).json({ error: 'No autorizado' });
  return next();
}
