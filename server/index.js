import './lib/env.js';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { DIST_DIR, UPLOAD_DIR } from './lib/paths.js';
import { asegurarDirectorio } from './lib/uploads.js';
import rutasPublicas from './routes/publicas.js';
import rutasAdmin from './routes/admin.js';

const app = express();
const PUERTO = Number(process.env.PORT) || 3001;

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

async function iniciar() {
  await asegurarDirectorio();

  app.use('/uploads', express.static(UPLOAD_DIR, { index: false, fallthrough: true }));
  app.use('/api', rutasPublicas);
  app.use('/api/admin', rutasAdmin);

  if (fs.existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR, { index: false }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
      return res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  }

  app.use((_req, res) => res.status(404).json({ error: 'No encontrado' }));

  app.use((error, _req, res, _next) => {
    const estado = error.status || (error.name === 'MulterError' ? 400 : 500);
    if (estado === 500) console.error(error);
    res.status(estado).json({
      error: estado === 500 ? 'Error interno del servidor' : error.message || 'Error'
    });
  });

  app.listen(PUERTO, () => {
    console.log(`Catálogo disponible en http://localhost:${PUERTO}`);
  });
}

iniciar().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error);
  process.exitCode = 1;
});
