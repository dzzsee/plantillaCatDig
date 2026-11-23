import { Link } from 'react-router-dom';
import { IlustracionesLaboratorio } from '../components/IlustracionesLaboratorio';
import { useConfig } from '../context/config-context';
import { enlaceWhatsApp } from '../utils/format';

export function Inicio() {
  const { configuracion } = useConfig();
  const enlace = enlaceWhatsApp(configuracion);

  return (
    <div className="inicio">
      <section className="inicio-hero">
        <div className="contenedor inicio-hero-inner">
          <IlustracionesLaboratorio />
          <div className="inicio-hero-cuerpo">
            <h1>Cada resultado empieza con el equipo adecuado.</h1>
            <div className="inicio-hero-pie">
              <p>
                En {configuracion.nombreNegocio} pensamos en el trabajo de todos los días: analizar
                muestras, observar preparados, centrifugar. Cada ficha dice qué es el equipo, para
                qué sirve y un precio de referencia. Si te interesa uno, pregunta desde ahí.
              </p>
              <div className="inicio-acciones">
                <Link className="btn btn-hero btn-grande" to="/catalogo">
                  Explorar catálogo
                </Link>
                {enlace && (
                  <a className="enlace-claro" href={enlace} target="_blank" rel="noreferrer">
                    Consultar por WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="inicio-nosotros contenedor">
        <div className="inicio-nosotros-marca">
          {configuracion.logo && <img src={configuracion.logo} alt="" />}
          <span>{configuracion.nombreNegocio}</span>
        </div>
        <div className="inicio-nosotros-texto">
          <h2>Qué vas a encontrar</h2>
          <p>
            Equipos y materiales para las áreas que más se usan en un laboratorio clínico: análisis,
            microscopía, centrifugado e insumos. Cada ficha muestra la descripción y un precio de
            referencia para que sepas si encaja con lo que buscas.
          </p>
          <p>
            Si necesitas un modelo puntual, disponibilidad o condiciones de compra, consúltanos
            desde el producto. La conversación empieza ahí, con el equipo que te interesa a la vista.
          </p>
        </div>
      </section>
    </div>
  );
}
