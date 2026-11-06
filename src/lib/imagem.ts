const LADO_MAXIMO = 640

// Reduz a foto (máx. 640px, JPEG) para caber no armazenamento local da demo
export function reduzirImagem(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo'))
    leitor.onload = () => {
      const imagem = new Image()
      imagem.onerror = () => reject(new Error('Arquivo de imagem inválido'))
      imagem.onload = () => {
        const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(imagem.width * escala)
        canvas.height = Math.round(imagem.height * escala)
        const contexto = canvas.getContext('2d')
        if (!contexto) {
          reject(new Error('Navegador sem suporte a canvas'))
          return
        }
        contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      imagem.src = String(leitor.result)
    }
    leitor.readAsDataURL(arquivo)
  })
}
