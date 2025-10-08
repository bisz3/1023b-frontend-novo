const API_BASE_URL = '/api';

interface ItemCarrinho {
  _id: string;
  produto: ProdutoType;
  quantidade: number;
  criadoEm: string;
}

interface ProdutoType {
  _id: string;
  nome: string;
  preco: number;
  urlfoto: string;
  descricao: string;
}

// Função auxiliar para obter o ID do usuário logado
const getUsuarioId = (): string => {
  const usuarioString = localStorage.getItem('usuario');
  if (!usuarioString) {
    throw new Error('Usuário não autenticado');
  }
  try {
    const usuario = JSON.parse(usuarioString);
    if (!usuario || !usuario._id) {
      throw new Error('ID do usuário não encontrado nos dados salvos');
    }
    return usuario._id;
  } catch (error) {
    console.error('Erro ao analisar dados do usuário:', error);
    throw new Error('Dados de usuário corrompidos');
  }
};

export const fetchCarrinho = async (): Promise<ItemCarrinho[]> => {
  const usuarioId = getUsuarioId();
  const response = await fetch(`${API_BASE_URL}/carrinho?usuarioId=${usuarioId}`);
  if (!response.ok) {
    throw new Error('Erro ao carregar o carrinho');
  }
  return response.json();
};

export const adicionarAoCarrinho = async (produtoId: string, quantidade: number = 1): Promise<ItemCarrinho> => {
  const usuarioId = getUsuarioId();
  const response = await fetch(`${API_BASE_URL}/carrinho`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      produtoId,
      quantidade,
      usuarioId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao adicionar ao carrinho');
  }

  return response.json();
};

export const removerDoCarrinho = async (itemId: string): Promise<void> => {
  const usuarioId = getUsuarioId();
  const response = await fetch(`${API_BASE_URL}/carrinho/${usuarioId}/itens/${itemId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao remover do carrinho');
  }
};