import type { SelectHTMLAttributes } from 'react'
import seta from '../../assets/icons/seta.svg'
import { fieldClasses, type FieldSize } from './fieldStyles'

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  size?: FieldSize
}

// Seletor nativo com a seta do Figma (13:45)
export default function Select({ size = 'md', className = '', children, ...props }: SelectProps) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <select className={`${fieldClasses(size)} cursor-pointer appearance-none truncate pr-8`} {...props}>
        {children}
      </select>
      <img
        src={seta}
        alt=""
        width={10}
        height={10}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
      />
    </div>
  )
}
