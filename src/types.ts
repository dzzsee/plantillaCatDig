export interface Moneda {
  simbolo: string;
  codigo: string;
  posicion: 'antes' | 'despues';
}

export interface Colores {
  primario: string;
  acento: string;
  fondo: string;
  texto: string;
}

export interface Configuracion {
  nombreNegocio: string;
  eslogan: string;
  logo: string;
  whatsapp: string;
  mensajeWhatsApp: string;
  moneda: Moneda;
  colores: Colores;
}

export interface Categoria {
  id: string;
  nombre: string;
  orden: number;
  total?: number;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  categoriaId: string | null;
  precioMin: number;
  precioMax: number;
  imagenes: string[];
  activo: boolean;
  orden: number;
  creadoEn: string;
  actualizadoEn: string;
}

export type DatosProducto = Pick<
  Producto,
  'nombre' | 'descripcion' | 'categoriaId' | 'precioMin' | 'precioMax' | 'imagenes' | 'activo' | 'orden'
>;

export type DatosCategoria = Pick<Categoria, 'nombre' | 'orden'>;
