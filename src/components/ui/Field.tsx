import type { ReactNode } from 'react'
import { fieldErrorId } from './fieldStyles'

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
  className?: string
}

// Rótulo pequeno em caixa alta + campo + erro (Figma 24:291)
export default function Field({ label, htmlFor, error, children, className = '' }: FieldProps) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="font-label text-label font-semibold text-muted uppercase">
        {label}
      </label>
      {children}
      {error && (
        <p id={fieldErrorId(htmlFor)} className="px-3.5 text-caption text-brand">
          {error}
        </p>
      )}
    </div>
  )
}
