import { CORES_AMOSTRA } from '../../data/catalogo'

// Bolinha com a cor da peça; cor sem amostra cai no neutro
export default function AmostraCor({ cor, tamanho = 'md' }: { cor: string; tamanho?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 rounded-full border border-line-strong ${tamanho === 'sm' ? 'size-2.5' : 'size-3'}`}
      style={{ backgroundColor: CORES_AMOSTRA[cor] ?? 'var(--color-line)' }}
    />
  )
}
