interface Props {
  valor: string;
  onChange: (valor: string) => void;
}

export function SearchBar({ valor, onChange }: Props) {
  return (
    <div className="campo-busqueda">
      <label className="sr-only" htmlFor="buscar-productos">
        Buscar productos
      </label>
      <span aria-hidden="true">⌕</span>
      <input
        id="buscar-productos"
        type="search"
        placeholder="Buscar productos…"
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
      />
    </div>
  );
}
