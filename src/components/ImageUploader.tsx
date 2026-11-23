import { useRef, useState } from 'react';
import { api } from '../api/client';

interface Props {
  imagenes: string[];
  onChange: (imagenes: string[]) => void;
}

export function ImageUploader({ imagenes, onChange }: Props) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const entrada = useRef<HTMLInputElement>(null);

  async function subir(archivos: FileList | null) {
    if (!archivos?.length) return;
    setSubiendo(true);
    setError('');
    try {
      const urls = await api.admin.subirImagenes(Array.from(archivos));
      onChange([...imagenes, ...urls]);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No se pudieron subir las imágenes');
    } finally {
      setSubiendo(false);
      if (entrada.current) entrada.current.value = '';
    }
  }

  function quitar(url: string) {
    onChange(imagenes.filter((imagen) => imagen !== url));
    void api.admin.eliminarImagen(url).catch(() => undefined);
  }

  return (
    <div className="cargador-imagenes">
      <label className="btn btn-secondary btn-sm" htmlFor="imagenes-producto">
        {subiendo ? 'Subiendo…' : 'Agregar imágenes'}
      </label>
      <input
        ref={entrada}
        id="imagenes-producto"
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        disabled={subiendo}
        onChange={(evento) => void subir(evento.target.files)}
      />
      <p className="ayuda">PNG, JPG, WEBP o GIF. Hasta 8 imágenes, 5 MB cada una.</p>
      {error && <p className="mensaje-error">{error}</p>}
      {imagenes.length > 0 && (
        <div className="miniaturas">
          {imagenes.map((url) => (
            <div className="miniatura" key={url}>
              <img src={url} alt="Imagen del producto" />
              <button type="button" onClick={() => quitar(url)} aria-label="Quitar imagen">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
