import type { Categoria } from '../types';

interface Props {
  categorias: Categoria[];
  valor: string;
  onChange: (valor: string) => void;
}

export function CategoryFilter({ categorias, valor, onChange }: Props) {
  return (
    <div className="filtros-categoria" role="group" aria-label="Filtrar por categoría">
      <button
        type="button"
        className={valor === '' ? 'chip activo' : 'chip'}
        aria-pressed={valor === ''}
        onClick={() => onChange('')}
      >
        Todos
      </button>
      {categorias.map((categoria) => (
        <button
          key={categoria.id}
          type="button"
          className={valor === categoria.id ? 'chip activo' : 'chip'}
          aria-pressed={valor === categoria.id}
          onClick={() => onChange(categoria.id)}
        >
          {categoria.nombre}
          {typeof categoria.total === 'number' && <span className="chip-total">{categoria.total}</span>}
        </button>
      ))}
    </div>
  );
}
