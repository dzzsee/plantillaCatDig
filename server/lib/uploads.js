import fs from 'node:fs/promises';
import path from 'node:path';
import { UPLOAD_DIR } from './paths.js';

const RAIZ = path.resolve(UPLOAD_DIR);

export async function asegurarDirectorio() {
  await fs.mkdir(RAIZ, { recursive: true });
}

export async function eliminarImagenes(urls) {
  if (!Array.isArray(urls)) return;
  await Promise.all(
    urls
      .filter((url) => typeof url === 'string' && url.startsWith('/uploads/'))
      .map(async (url) => {
        const ruta = path.resolve(RAIZ, path.basename(url));
        if (path.dirname(ruta) !== RAIZ) return;
        try {
          await fs.unlink(ruta);
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }
      })
  );
}
