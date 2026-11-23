interface Props {
  valor: string;
  onChange: (valor: string) => void;
}

const OPCIONES = [
  { valor: 'nombre_asc', etiqueta: 'Nombre: A – Z' },
  { valor: 'nombre_desc', etiqueta: 'Nombre: Z – A' },
  { valor: 'precio_asc', etiqueta: 'Precio: menor a mayor' },
  { valor: 'precio_desc', etiqueta: 'Precio: mayor a menor' }
];

export function SortSelect({ valor, onChange }: Props) {
  return (
    <div className="campo-orden">
      <label htmlFor="orden-productos">Ordenar por</label>
      <select id="orden-productos" value={valor} onChange={(evento) => onChange(evento.target.value)}>
        {OPCIONES.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </div>
  );
}
