import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT_DIR = path.resolve(__dirname, '..', '..');

function desdeRaiz(valor, porDefecto) {
  if (!valor) return path.join(ROOT_DIR, porDefecto);
  return path.isAbsolute(valor) ? valor : path.resolve(ROOT_DIR, valor);
}

export const DATA_DIR = desdeRaiz(process.env.DATA_DIR, 'server/data');
export const UPLOAD_DIR = desdeRaiz(process.env.UPLOAD_DIR, 'server/uploads');
export const DIST_DIR = path.join(ROOT_DIR, 'dist');
