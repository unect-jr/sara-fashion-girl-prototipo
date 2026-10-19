interface VendedoraAvatarProps {
  nome: string
  size?: 'md' | 'lg'
}

// Sem foto no protótipo: placeholder com as iniciais (o Figma marca a foto como "substituir")
export default function VendedoraAvatar({ nome, size = 'md' }: VendedoraAvatarProps) {
  const partes = nome.trim().split(/\s+/)
  const iniciais = `${partes[0]?.[0] ?? ''}${partes.length > 1 ? partes[partes.length - 1][0] : ''}`.toUpperCase()

  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-tint font-semibold text-brand ${
        size === 'lg' ? 'size-16 text-metric' : 'size-13 text-title'
      }`}
    >
      {iniciais}
    </div>
  )
}
