import type { Produto, Tamanho, Variacao } from './types'

// Grade de uma cor: { P: 4, M: 6 } → variações com a quantidade no estoque central
function grade(cor: string, quantidades: Partial<Record<Tamanho, number>>): Variacao[] {
  return (Object.entries(quantidades) as [Tamanho, number][]).map(([tamanho, quantidadeCentral]) => ({
    tamanho,
    cor,
    quantidadeCentral,
  }))
}

export const produtosSeed: Produto[] = [
  // Vestidos
  { id: 'p01', nome: 'Vestido midi floral', categoria: 'vestido', preco: 189.9, custo: 82, variacoes: grade('Floral', { P: 5, M: 0, G: 0, GG: 2 }) },
  { id: 'p02', nome: 'Vestido longo canelado', categoria: 'vestido', preco: 219.9, custo: 96, variacoes: [...grade('Preto', { P: 8, M: 12, G: 9 }), ...grade('Caramelo', { P: 6, M: 8, G: 5 })] },
  { id: 'p03', nome: 'Vestido chemise de linho', categoria: 'vestido', preco: 239.9, custo: 108, variacoes: grade('Areia', { P: 4, M: 7, G: 6 }) },
  { id: 'p04', nome: 'Vestido tubinho de crepe', categoria: 'vestido', preco: 169.9, custo: 72, variacoes: [...grade('Preto', { P: 9, M: 11, G: 8, GG: 4 }), ...grade('Vinho', { P: 5, M: 6, G: 4 })] },
  { id: 'p05', nome: 'Vestido envelope estampado', categoria: 'vestido', preco: 199.9, custo: 86, variacoes: grade('Estampado', { P: 6, M: 9, G: 7 }) },
  { id: 'p06', nome: 'Vestido ciganinha', categoria: 'vestido', preco: 159.9, custo: 66, variacoes: [...grade('Branco', { P: 7, M: 10, G: 6 }), ...grade('Rosa', { P: 3, M: 2, G: 1 })] },
  { id: 'p07', nome: 'Vestido slip de cetim', categoria: 'vestido', preco: 179.9, custo: 78, variacoes: [...grade('Champanhe', { P: 5, M: 8, G: 6 }), ...grade('Verde-oliva', { P: 4, M: 6, G: 3 })] },

  // Blusas
  { id: 'p08', nome: 'Blusa cropped canelada', categoria: 'blusa', preco: 69.9, custo: 26, variacoes: [...grade('Branco', { P: 14, M: 18, G: 12 }), ...grade('Preto', { P: 12, M: 16, G: 10 })] },
  { id: 'p09', nome: 'Camisa de linho', categoria: 'blusa', preco: 149.9, custo: 62, variacoes: [...grade('Branco', { P: 8, M: 12, G: 9 }), ...grade('Azul-claro', { P: 6, M: 8, G: 5 })] },
  { id: 'p10', nome: 'Blusa ombro a ombro', categoria: 'blusa', preco: 89.9, custo: 34, variacoes: grade('Off-white', { P: 10, M: 14, G: 8 }) },
  { id: 'p11', nome: 'Regata de tricô', categoria: 'blusa', preco: 79.9, custo: 30, variacoes: [...grade('Bege', { P: 9, M: 12, G: 7 }), ...grade('Preto', { P: 8, M: 10, G: 6 })] },
  { id: 'p12', nome: 'Body decote V', categoria: 'blusa', preco: 99.9, custo: 38, variacoes: [...grade('Preto', { P: 11, M: 15, G: 9 }), ...grade('Nude', { P: 7, M: 9, G: 5 })] },
  { id: 'p13', nome: 'Blusa de cetim', categoria: 'blusa', preco: 119.9, custo: 48, variacoes: [...grade('Vinho', { P: 6, M: 8, G: 5 }), ...grade('Champanhe', { P: 5, M: 7, G: 4 })] },
  { id: 'p14', nome: 'T-shirt básica de algodão', categoria: 'blusa', preco: 49.9, custo: 18, variacoes: [...grade('Branco', { P: 20, M: 26, G: 18, GG: 10 }), ...grade('Preto', { P: 18, M: 24, G: 16, GG: 8 })] },

  // Calças
  { id: 'p15', nome: 'Calça pantalona de alfaiataria', categoria: 'calca', preco: 189.9, custo: 80, variacoes: [...grade('Preto', { P: 8, M: 12, G: 10 }), ...grade('Bege', { P: 6, M: 9, G: 7 })] },
  { id: 'p16', nome: 'Calça wide leg jeans', categoria: 'calca', preco: 199.9, custo: 88, variacoes: grade('Jeans claro', { P: 9, M: 13, G: 10, GG: 5 }) },
  { id: 'p17', nome: 'Calça cargo de sarja', categoria: 'calca', preco: 169.9, custo: 70, variacoes: [...grade('Cáqui', { P: 7, M: 10, G: 8 }), ...grade('Preto', { P: 6, M: 8, G: 6 })] },
  { id: 'p18', nome: 'Calça jogger de moletinho', categoria: 'calca', preco: 129.9, custo: 52, variacoes: grade('Mescla', { P: 10, M: 14, G: 11 }) },
  { id: 'p19', nome: 'Calça flare jeans', categoria: 'calca', preco: 189.9, custo: 82, variacoes: grade('Jeans escuro', { P: 8, M: 12, G: 9, GG: 4 }) },

  // Saias
  { id: 'p20', nome: 'Saia midi plissada', categoria: 'saia', preco: 149.9, custo: 60, variacoes: [...grade('Preto', { P: 7, M: 9, G: 6 }), ...grade('Verde-oliva', { P: 4, M: 6, G: 4 })] },
  { id: 'p21', nome: 'Saia jeans curta', categoria: 'saia', preco: 119.9, custo: 48, variacoes: grade('Jeans claro', { P: 10, M: 13, G: 9 }) },
  { id: 'p22', nome: 'Saia longa estampada', categoria: 'saia', preco: 159.9, custo: 66, variacoes: grade('Estampado', { P: 6, M: 8, G: 5 }) },
  { id: 'p23', nome: 'Saia lápis de couro eco', categoria: 'saia', preco: 139.9, custo: 58, variacoes: [...grade('Preto', { P: 5, M: 7, G: 5 }), ...grade('Caramelo', { P: 2, M: 3, G: 2 })] },
  { id: 'p24', nome: 'Short-saia de linho', categoria: 'saia', preco: 109.9, custo: 44, variacoes: [...grade('Areia', { P: 8, M: 10, G: 7 }), ...grade('Branco', { P: 6, M: 9, G: 6 })] },
]
