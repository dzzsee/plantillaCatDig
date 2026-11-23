# plantillaCatDig

Catálogo digital con panel de administración. React + Vite en el cliente y un servidor Express que guarda los datos en `server/data/`.

## Arrancar

```bash
npm install
cp .env.example .env
npm run dev
```

La página de inicio queda en `http://localhost:5173`, el catálogo en `/catalogo` y la API en `http://localhost:3001`.

## Producción

```bash
npm run build
npm start
```

Todo se sirve en un solo puerto (`PORT`, por defecto 3001).

Antes de publicar, cambia `ADMIN_USER`, `ADMIN_PASSWORD` y `SESSION_SECRET` en `.env`.

## Personalización

Entra a `/admin` con esas credenciales. Desde el panel puedes crear productos y categorías, subir imágenes y cambiar nombre, WhatsApp, moneda y colores sin tocar código.

La primera imagen de cada producto se muestra como principal; las siguientes se recorren en el carrusel de la ficha.
