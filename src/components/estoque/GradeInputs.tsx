import { TAMANHOS_GRADE } from '../../data/catalogo'
import type { Grade } from '../../lib/grade'
import { NUMBER_RESET } from '../ui/fieldStyles'

interface GradeInputsProps {
  idPrefix: string
  value: Grade
  onChange: (grade: Grade) => void
  invalid?: boolean
  describedBy?: string
}

const MAXIMO = 999

// Quantidade por tamanho em pílulas (Figma 24:318: rótulo à esquerda, número à direita)
export default function GradeInputs({ idPrefix, value, onChange, invalid = false, describedBy }: GradeInputsProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {TAMANHOS_GRADE.map((tamanho, index) => {
        const id = `${idPrefix}-${tamanho}`
        return (
          <label
            key={tamanho}
            htmlFor={id}
            className={`flex cursor-text items-center justify-between gap-2 rounded-full border bg-surface px-3.5 py-2.5 transition-colors focus-within:border-info focus-within:ring-[0.5px] focus-within:ring-info ${invalid ? 'border-brand' : 'border-line-strong'}`}
          >
            <span className="font-label text-eyebrow font-semibold tracking-[0.1em] text-muted">{tamanho}</span>
            <input
              id={id}
              type="number"
              inputMode="numeric"
              min={0}
              max={MAXIMO}
              placeholder="0"
              aria-label={`Quantidade no tamanho ${tamanho}`}
              aria-invalid={invalid || undefined}
              aria-describedby={index === 0 ? describedBy : undefined}
              value={value[tamanho] === 0 ? '' : value[tamanho]}
              onChange={(event) => {
                const quantidade = Math.min(MAXIMO, Math.max(0, Math.floor(Number(event.target.value) || 0)))
                onChange({ ...value, [tamanho]: quantidade })
              }}
              className={`w-12 bg-transparent text-right text-row font-semibold text-ink tabular-nums outline-none placeholder:text-track ${NUMBER_RESET}`}
            />
          </label>
        )
      })}
    </div>
  )
}
