import { useEffect, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

interface Props {
  imagenes: string[];
  nombre: string;
}

export function GaleriaProducto({ imagenes, nombre }: Props) {
  const [indice, setIndice] = useState(0);
  const [origen, setOrigen] = useState('50% 50%');
  const [ampliar, setAmpliar] = useState(false);
  const clave = imagenes.join('|');

  useEffect(() => {
    setIndice(0);
    setAmpliar(false);
  }, [clave]);

  const total = imagenes.length;

  const cambiar = (paso: number) => {
    setIndice((actual) => (actual + paso + total) % total);
    setAmpliar(false);
  };

  const moverCursor = (evento: PointerEvent<HTMLDivElement>) => {
    if (evento.pointerType !== 'mouse') return;
    const rect = evento.currentTarget.getBoundingClientRect();
    const x = ((evento.clientX - rect.left) / rect.width) * 100;
    const y = ((evento.clientY - rect.top) / rect.height) * 100;
    setOrigen(`${x}% ${y}%`);
  };

  const manejarTeclas = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (evento.key === 'ArrowRight') {
      evento.preventDefault();
      cambiar(1);
    }
    if (evento.key === 'ArrowLeft') {
      evento.preventDefault();
      cambiar(-1);
    }
  };

  if (total === 0) {
    return (
      <div className="galeria-principal galeria-vacia">
        <span className="imagen-vacia" aria-hidden="true">
          {nombre.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  const imagen = imagenes[indice];

  return (
    <div className="galeria">
      <div
        className={`galeria-principal${ampliar ? ' ampliada' : ''}`}
        tabIndex={0}
        role="group"
        aria-roledescription="galería de imágenes"
        aria-label={`Imágenes de ${nombre}`}
        onKeyDown={manejarTeclas}
        onPointerMove={moverCursor}
        onPointerEnter={(evento) => {
          if (evento.pointerType === 'mouse') setAmpliar(true);
        }}
        onPointerLeave={() => setAmpliar(false)}
      >
        <img
          src={imagen}
          alt={`${nombre}, imagen ${indice + 1} de ${total}`}
          style={{ transformOrigin: origen }}
        />
        {total > 1 && (
          <>
            <button
              className="galeria-flecha anterior"
              type="button"
              onClick={() => cambiar(-1)}
              aria-label="Imagen anterior"
            >
              ‹
            </button>
            <button
              className="galeria-flecha siguiente"
              type="button"
              onClick={() => cambiar(1)}
              aria-label="Imagen siguiente"
            >
              ›
            </button>
            <span className="galeria-contador" aria-live="polite">
              {indice + 1} / {total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="galeria-miniaturas" aria-label="Seleccionar imagen">
          {imagenes.map((url, posicion) => (
            <button
              key={`${url}-${posicion}`}
              className={posicion === indice ? 'miniatura activa' : 'miniatura'}
              type="button"
              onClick={() => {
                setIndice(posicion);
                setAmpliar(false);
              }}
              aria-label={`Ver imagen ${posicion + 1} de ${total}`}
              aria-pressed={posicion === indice}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      )}

      <p className="ayuda galeria-ayuda">
        <span className="zoom-ayuda">Pasa el cursor sobre la imagen para ampliar. </span>
        Usa las flechas o las miniaturas para cambiar de vista.
      </p>
    </div>
  );
}
