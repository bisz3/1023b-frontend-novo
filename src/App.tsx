import { useEffect, useState } from 'react'
import './App.css'

interface ProdutoType {
  id: string | number
  nome: string
  preco: number
  urlfoto: string
  descricao: string
}

interface RawProduto {
  id?: string | number
  _id?: { toString?: () => string } | string | number
  nome: string
  preco: number
  urlfoto: string
  descricao: string
}
const API_BASE = (import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_API_URL || '/api'

function App() {
  const [produtos, setProdutos] = useState<ProdutoType[]>([])


  useEffect(() => {
    fetch(`${API_BASE}/produtos`)
      .then(response => response.json())
      .then((data: RawProduto[]) => {
        const normalized: ProdutoType[] = data.map((p: RawProduto) => ({
          id: p.id ?? (p._id ? (typeof p._id === 'object' && p._id.toString ? p._id.toString() : p._id) : undefined) as string | number,
          nome: p.nome,
          preco: p.preco,
          urlfoto: p.urlfoto,
          descricao: p.descricao
        }))
        setProdutos(normalized)
      })
  }, [])

  const [formData, setFormData] = useState<Omit<ProdutoType, 'id'>>({ 
    nome: '',
    preco: 0,
    urlfoto: '',
    descricao: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'preco' ? parseFloat(value) || 0 : value
    }));
  };

  const handleForm = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/produtos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        // Build a richer error message containing HTTP status and response body
        const status = response.status
        let bodyText = ''
        try {
          const json = await response.json()
          bodyText = json.error || JSON.stringify(json)
        } catch {
          try { bodyText = await response.text() } catch { bodyText = '<no body>' }
        }
        throw new Error(`HTTP ${status} - ${bodyText}`)
      }
      
      // Limpar o formulário após o envio
      setFormData({ 
        nome: '',
        preco: 0,
        urlfoto: '',
        descricao: ''
      });
      
      // Atualizar a lista de produtos
      const produtosResponse = await fetch(`${API_BASE}/produtos`);
      const data = await produtosResponse.json() as RawProduto[];
      const normalized = data.map((p: RawProduto) => ({
        id: p.id ?? (p._id ? (typeof p._id === 'object' && p._id.toString ? p._id.toString() : p._id) : undefined) as string | number,
        nome: p.nome,
        preco: p.preco,
        urlfoto: p.urlfoto,
        descricao: p.descricao
      }))
      setProdutos(normalized);
      
      alert('Produto cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      const msg = error instanceof Error ? error.message : String(error)
      alert('Erro ao cadastrar produto: ' + msg)
    }
  }

  return (
    <>
    <div>Cadastro de Produtos</div>
    <form onSubmit={handleForm} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px', marginBottom: '20px' }}>
      <input 
        type="text" 
        name="nome" 
        placeholder="Nome"
        value={formData.nome}
        onChange={handleInputChange}
        required
      />
      <input 
        type="number" 
        name="preco" 
        placeholder="Preço"
        value={formData.preco || ''}
        onChange={handleInputChange}
        step="0.01"
        min="0"
        required
      />
      <input 
        type="url" 
        name="urlfoto" 
        placeholder="URL da imagem"
        value={formData.urlfoto}
        onChange={handleInputChange}
        required
      />
      <input 
        type="text" 
        name="descricao" 
        placeholder="Descrição"
        value={formData.descricao}
        onChange={handleInputChange}
        required
      />
      <button type="submit" style={{ padding: '8px', cursor: 'pointer' }}>Cadastrar</button>
    </form>
      <h1>Produtos</h1>
      <ul style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
        {produtos.map(produto => (
          <li key={produto.id} style={{ margin: '10px' }}>
            <img src={produto.urlfoto} alt={produto.nome} width={200} />
            <p>{produto.descricao}</p>
            <p>R$ {produto.preco}</p>
            <p>{produto.nome}</p>
            <button>Comprar</button>
          </li>
        ))}
      </ul>
    </>
  )
}

export default App