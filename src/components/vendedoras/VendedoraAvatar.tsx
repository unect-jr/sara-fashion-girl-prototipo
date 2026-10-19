interface VendedoraAvatarProps {
  nome: string
  size?: 'sm' | 'md' | 'lg'
}

// sm: linha da remessa (Figma 17:64)
const SIZES = { sm: 'size-8.5 text-button-sm', md: 'size-13 text-title', lg: 'size-16 text-metric' }

// Sem foto no protótipo: placeholder com as iniciais (o Figma marca a foto como "substituir")
export default function VendedoraAvatar({ nome, size = 'md' }: VendedoraAvatarProps) {
  const partes = nome.trim().split(/\s+/)
  const iniciais = `${partes[0]?.[0] ?? ''}${partes.length > 1 ? partes[partes.length - 1][0] : ''}`.toUpperCase()

  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-tint font-semibold text-brand ${SIZES[size]}`}
    >
      {iniciais}
    </div>
  )
}
